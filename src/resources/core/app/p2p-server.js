const Websocket = require('ws');
const { EventEmitter } = require('events');
const ngrok = require('ngrok');
const uuid = require('uuid').v1;
const {
  MAXIMUM_INBOUNDS,
  MAXIMUM_OUTBOUNDS,
  P2P_SOCKET_RECONNECTION_RETRIES,
  P2P_SOCKET_RECONNECTION_INTERVAL,
} = require('../config');

const MESSAGE_TYPES = {
  handshakeReq: 'HANDSHAKE_REQUEST',
  handshakeRes: 'HANDSHAKE_RESPONSE',
  chain: 'CHAIN',
  transaction: 'TRANSACTION',
  transactionPool: 'TRANSACTION_POOL',
  peers: 'PEERS',
  socketInfoReq: 'SOCKET_INFO_REQUEST',
  socketInfoRes: 'SOCKET_INFO_RESPONSE',
  miningStarted: 'MINING_STARTED',
  miningStopped: 'MINING_STOPPED',
  miners: 'MINERS',
};

class P2pServer extends EventEmitter {
  constructor(blockchain, transactionPool) {
    super();
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.inbounds = {};
    this.outbounds = {};
    this.server = null;
    this.host = null;
    this.port = null;
    this.protocol = 'http';
    this.externalDomain = null;
    this.externalPort = null;
    this.externalAddress = null;
    this.ngrokHost = null;
    this.peers = [];
    this.miners = {};
    this.id = uuid();
  }

  get inboundsList() {
    return Object.keys(this.inbounds);
  }

  get outboundsList() {
    return Object.keys(this.outbounds);
  }

  get outboundsQuantity() {
    return this.outboundsList.length;
  }

  get inboundsQuantity() {
    return this.inboundsList.length;
  }

  get allSockets() {
    return [...Object.values(this.inbounds), ...Object.values(this.outbounds)];
  }

  get allSocketsQuantity() {
    return this.allSockets.length;
  }

  close() {
    this.server.close();
  }

  async listen({
    host = '127.0.0.1', port, ngrokAuthToken = null, peers,
  }, cb = null) {
    this.port = port;
    this.host = host;
    this.peers = peers;

    if (ngrokAuthToken !== null) {
      await this.ngrokConnect(ngrokAuthToken);
    }

    this.server = new Websocket.Server({ host, port });
    this.server.on('connection', (socket, req) => {
      if (this.inboundsQuantity < MAXIMUM_INBOUNDS) {
        const socketExternalAddressObj = this.parseSocketExternalAddressObj(req);

        this.addServerAddressToSocket(socket, {
          protocol: this.protocol,
          domain: socketExternalAddressObj.domain,
          port: socketExternalAddressObj.port,
        });

        this.connectSocket(socket);
        this.requestHandshake(socket, {
          socketExternalAddressObj,
          socketID: this.id,
          connection: 'inbound',
        });
      }
    });
    this.server.on('error', (err) => {
      this.emit('error', 'Error occurred during P2P-server listening...');
      console.log(err);
    });

    this.connectToPeers();

    this.emit(
      'success',
      `Your server was creates successfully. Your internal address:
      ${this.protocol}://${this.host}:${this.port}`,
    );
    if (cb !== null) cb();
  }

  async ngrokConnect(ngrokAuthToken) {
    try {
      this.ngrokHost = await ngrok.connect({
        proto: 'http', // http|tcp|tls, defaults to http
        addr: `${this.host}:${this.port}`, // port or network address, defaults to 80
        authtoken: ngrokAuthToken, // your authtoken from ngrok.com
        region: 'us', // one of ngrok regions (us, eu, au, ap, sa, jp, in), defaults to us
        onStatusChange: status => {
          if (status === 'closed') {
            this.ngrokConnect(ngrokAuthToken);
          }
        }, // 'closed' - connection is lost, 'connected' - reconnected
      });
    } catch (e) {
      console.log(e);
      this.emit('error', 'Can\'t connect ngrok. Check your ngrok API key.');
      return;
    }

    this.externalDomain = this.ngrokHost.replace(/^https?:\/\//g, '');
    this.externalPort = '80';
    this.externalAddress = `${this.protocol}://${this.externalDomain}:${this.externalPort}`;

    this.emit(
      'info',
      `Your server external address is ${this.protocol}://${this.externalDomain}:${this.externalPort}`,
    );
  }

  parsePeerAddress(peerAddress) {
    const parsedPeerLink = /(.+):\/\/([\d\w.\-_]+?):(.+)$/gi.exec(peerAddress);

    const [, serverProtocol, serverDomain, serverPort] = parsedPeerLink;
    return {
      serverProtocol,
      serverDomain,
      serverPort,
    };
  }

  connectToPeers() {
    while (this.peers.length && this.outboundsQuantity < MAXIMUM_OUTBOUNDS) {
      let peerAddress = this.peers.pop();

      const parsedPeerLink = this.parsePeerAddress(peerAddress);
      if (parsedPeerLink) {
        const { serverProtocol, serverDomain, serverPort } = parsedPeerLink;
        peerAddress = `${this.protocol}://${serverDomain}:${serverPort}`;

        // EXAMPLE: http://localhost:5001 || ws://localhost:5001
        this.connectToPeer({
          serverAddress: peerAddress,
          serverProtocol,
          serverDomain,
          serverPort,
          checking: false,
        });
      }
    }
    this.peers = [];
  }

  connectToPeer(
    {
      serverAddress,
      serverProtocol,
      serverDomain,
      serverPort,
      checking = false,
    },
    retries = P2P_SOCKET_RECONNECTION_RETRIES,
  ) {
    console.log('-'.repeat(10));
    console.log(`Trying to connect to peer ${serverAddress}`);
    console.log(`Retries remain ${retries}`);
    console.log('-'.repeat(10));

    if (!checking) {
      const connectionWithAddressExists = this.allSockets
        .find(socket => socket.serverAddress === serverAddress);

      if (connectionWithAddressExists) return;
    }

    const socket = new Websocket(serverAddress);

    this.addServerAddressToSocket(socket, {
      protocol: serverProtocol,
      domain: serverDomain,
      port: serverPort,
    });

    socket.on('open', () => {
      this.connectSocket(socket);

      this.requestHandshake(socket, {
        socketID: this.id,
        connection: 'outbound',
        socketExternalAddressObj: {
          protocol: serverProtocol,
          domain: serverDomain,
          port: serverPort,
          address: serverAddress,
        },
      });

      console.log(`Connected to peer: ${serverAddress}`);
      // plus one because of "retries - 1" below
      retries = P2P_SOCKET_RECONNECTION_RETRIES + 1;
    });

    socket.on('error', (err) => {
      console.log(err);
    });

    socket.on('close', () => {
      if (this.outbounds[socket.id]) {
        delete this.outbounds[socket.id];
      }

      if (checking) {
        const checkedSocket = this.inbounds
          .find(inbound => inbound.serverAddress === serverAddress);
        if (checkedSocket && !checkedSocket.available) {
          checkedSocket.checking = false;
          checkedSocket.available = false;
          // TODO: send info about socket availability maybe?
          // not sure ab it
        }
        retries = 0;
      }
      if (retries === 0) return;

      setTimeout(
        () => this.connectToPeer({
          serverAddress,
          serverProtocol,
          serverDomain,
          serverPort,
        }, retries - 1),
        P2P_SOCKET_RECONNECTION_INTERVAL,
      );
    });
  }

  addServerAddressToSocket(socket, { protocol = this.protocol, domain = null, port = null }) {
    socket.serverProtocol = protocol;
    if (domain) socket.serverDomain = domain;
    if (port) socket.serverPort = port;
    if (domain && port) socket.serverAddress = `${protocol}://${domain}:${port}`;
  }

  requestHandshake(socket, data) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.handshakeReq,
      data,
    }));
  }

  connectSocket(socket) {
    this.addMsgHandler(socket);
    this.addCloseAndErrorHandler(socket);
  }

  sendData(socket) {
    this.sendPeers(socket);
    this.sendChain(socket);
    this.sendTransactionPool(socket);
    this.sendMiners(socket);
  }

  addCloseAndErrorHandler(socket) {
    // this works only once in retries
    const handler = (err) => {
      if (err instanceof Error) console.log(err);

      this.deleteMiner(socket.id);

      if (this.inbounds[socket.id]) {
        delete this.inbounds[socket.id];
      }
      if (this.outbounds[socket.id]) {
        delete this.outbounds[socket.id];
      }

      if (this.allSocketsQuantity === 0) {
        const serverAddress = `${socket.serverProtocol}://${socket.serverDomain}:${socket.serverPort}`;
        this.emit(
          'warning',
          `Connection with ${serverAddress} was broken. It was your last connection.`,
        );
      }
    };
    socket.on('close', handler);
    socket.on('error', handler);
  }

  addMsgHandler(socket) {
    socket.on('message', message => {
      const req = JSON.parse(message);
      const { data } = req;

      switch (req.type) {
        case MESSAGE_TYPES.chain: {
          console.log('on MESSAGE_TYPES.chain in p2p-server.js:');
          const chainReplaced = this.blockchain.replaceChain(data.chain, this.transactionPool);
          if (chainReplaced) {
            this.emit('blockchain-changed', { chain: this.blockchain.chain });
          }
          break;
        }
        case MESSAGE_TYPES.transaction:
          console.log('New transaction was received');
          this.transactionPool.replaceOrAddTransaction(data.transaction);

          this.emit('transaction-pool-changed', {
            transactions: this.transactionPool.transactions,
          });
          break;

        case MESSAGE_TYPES.transactionPool:
          for (const transaction of data.transactionPool) {
            this.transactionPool.replaceOrAddTransaction(transaction);
          }
          this.emit('transaction-pool-changed', {
            transactions: this.transactionPool.transactions,
          });
          break;

        case MESSAGE_TYPES.peers: {
          const peers = data.peers.filter(peer => peer !== this.externalAddress);

          this.peers.push(...peers);
          this.connectToPeers();
          break;
        }

        case MESSAGE_TYPES.handshakeReq: {
          const {
            protocol,
            domain: prevDomain,
          } = data.socketExternalAddressObj;

          const { socketID, connection } = data;
          socket.id = socketID;

          if (this.ngrokHost === null) {
            this.externalDomain = prevDomain;
            this.externalPort = this.port;

            this.externalAddress = `${protocol}://${this.externalDomain}:${this.externalPort}`;
            this.emit(
              'info',
              `Your external address: ${protocol}://${this.externalDomain}:${this.externalPort}`,
            );
          }

          socket.send(JSON.stringify({
            type: MESSAGE_TYPES.handshakeRes,
            data: {
              serverAddressObj: {
                protocol: this.protocol,
                domain: this.externalDomain,
                port: this.externalPort,
                address: `${this.protocol}://${this.externalDomain}:${this.externalPort}`,
              },
              socketID: this.id,
              connection,
            },
          }));
          break;
        }

        case MESSAGE_TYPES.handshakeRes: {
          // is this a socket checking?
          const { socketID } = data;
          const checkedSocket = this.inbounds[socketID];
          if (data.connection === 'outbound' && checkedSocket?.checking) {
            checkedSocket.available = true;
            checkedSocket.checking = false;
            socket.close();

            // this is for triggering this.inbounds proxy
            delete this.inbounds[socketID];
            this.inbounds[socketID] = checkedSocket;
            return;
          }
          /// /////////////////////////////////////////// //
          this.saveSocket(socket, data);
          this.sendData(socket);

          if (data.connection === 'inbound') {
            this.checkAccessibility(socket);
          }

          console.log('inbounds');
          console.log(this.inbounds);
          console.log('outbounds');
          console.log(this.outbounds);

          break;
        }

        case MESSAGE_TYPES.miningStarted:
          this.saveMiner(data.minerID);
          break;

        case MESSAGE_TYPES.miningStopped:
          this.deleteMiner(data.minerID);
          break;

        case MESSAGE_TYPES.miners:
          data.minerIDs.forEach(minerID => {
            this.saveMiner(minerID);
          });
          break;

        default:
          break;
      }
    });
  }

  sendChain(socket) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.chain,
      data: {
        chain: this.blockchain.chain,
      },
    }));
  }

  sendMiners(socket) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.miners,
      data: {
        minerIDs: Object.keys(this.miners),
      },
    }));
  }

  sendTransaction(socket, transaction) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.transaction,
      data: {
        transaction,
      },
    }));
  }

  sendTransactionPool(socket) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.transactionPool,
      data: {
        transactionPool: this.transactionPool.transactions,
      },
    }));
  }

  sendPeers(socket) {
    const peers = [
      ...Object.values(this.inbounds)
        .filter(_socket => _socket.id !== socket.id && _socket.available)
        .map(_socket => _socket.serverAddress),
      ...Object.values(this.outbounds)
        .filter(_socket => _socket.id !== socket.id)
        .map(_socket => _socket.serverAddress),
    ];

    if (peers.length) {
      socket.send(JSON.stringify({
        type: MESSAGE_TYPES.peers,
        data: { peers },
      }));
    }
  }

  sendMiningStarted(socket, minerID) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.miningStarted,
      data: { minerID },
    }));
  }

  sendMiningStopped(socket, minerID) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.miningStopped,
      data: { minerID },
    }));
  }

  checkAccessibility(socket) {
    socket.checking = true;

    const parsedAddress = this.parsePeerAddress(socket.serverAddress);
    if (!parsedAddress) return;

    const { serverProtocol, serverDomain, serverPort } = parsedAddress;
    this.connectToPeer({
      serverAddress: socket.serverAddress,
      serverProtocol,
      serverDomain,
      serverPort,
      checking: true,
    });
  }

  saveSocket(socket, data) {
    const { serverAddressObj } = data;
    const { socketID, connection } = data;

    socket.id = socketID;

    if (serverAddressObj.serverAddress !== socket.serverAddress) {
      this.addServerAddressToSocket(socket, serverAddressObj);
    }

    // we don't need more than one connection with same user
    if (this.outbounds[socketID] || this.inbounds[socketID]) {
      socket.close();
      return;
    }

    if (connection === 'outbound') {
      this.outbounds[socketID] = socket;
    } else {
      this.inbounds[socketID] = socket;
    }

    console.log(`Socket was connected: ${socket.serverAddress}`);
  }

  parseSocketExternalAddressObj(req) {
    const protocol = 'http';
    const domain = req.connection.remoteAddress;
    const port = req.connection.remotePort;

    return {
      protocol,
      domain,
      port,
      address: `${protocol}://${domain}:${port}`,
    };
  }

  saveMiner(minerID) {
    if (this.miners[minerID]) return;
    this.miners[minerID] = true;

    this.broadcastMiningStarted(minerID);
  }

  deleteMiner(minerID) {
    if (!minerID || !this.miners[minerID]) return;
    delete this.miners[minerID];

    this.broadcastMiningStopped(minerID);
  }

  syncChains() {
    this.allSockets.forEach(socket => this.sendChain(socket));
  }

  broadcastTransaction(transaction) {
    this.allSockets.forEach(socket => this.sendTransaction(socket, transaction));
  }

  broadcastMiningStarted(minerID = null) {
    if (minerID === null) minerID = this.id;

    this.allSockets.forEach(socket => this.sendMiningStarted(socket, minerID));
  }

  broadcastMiningStopped(minerID = null) {
    if (minerID === null) minerID = this.id;

    this.allSockets.forEach(socket => this.sendMiningStopped(socket, minerID));
  }
}

process.on('uncaughtException', err => console.log(err));
module.exports = P2pServer;
