const Websocket = require('ws');
const { EventEmitter } = require('events');
const ngrok = require('ngrok');
// TODO: rewrite it using uuid later...
// Now I'm using socket address, don't know why?!
const uuid = require('uuid').v1;
const {
  MAXIMUM_INBOUNDS,
  MAXIMUM_OUTBOUNDS,
  P2P_SOCKET_RECONNECTION_RETRIES,
  P2P_SOCKET_RECONNECTION_INTERVAL,
} = require('../config');

const MESSAGE_TYPES = {
  chain: 'CHAIN',
  transaction: 'TRANSACTION',
  transactionPool: 'TRANSACTION_POOL',
  peers: 'PEERS',
  serverExternalAddressReq: 'SERVER_EXTERNAL_ADDRESS_REQUEST',
  serverExternalAddressRes: 'SERVER_EXTERNAL_ADDRESS_RESPONSE',
  miningStarted: 'MINING_STARTED',
  miningStopped: 'MINING_STOPPED',
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
      this.sendPeers(socket);

      if (this.inboundsQuantity < MAXIMUM_INBOUNDS) {
        const socketExternalAddressObj = this.getSocketExternalAddressObj(req);
        const socketExternalAddress = socketExternalAddressObj.address;

        if (this.outbounds[socketExternalAddress] || this.inbounds[socketExternalAddress]) {
          socket.close();
          return;
        }

        this.addServerAddressToSocket(socket, {
          protocol: this.protocol,
          domain: socketExternalAddressObj.domain,
          port: socketExternalAddressObj.port,
        });

        this.inbounds[socketExternalAddress] = socket;

        this.connectSocket(socket);
        this.requestServerExternalAddress(socket, socketExternalAddressObj);
      }
    });
    this.server.on('error', (err) => {
      this.emit('error', 'Error occurred during P2P-server listening...');
      console.log(err);
    });

    this.connectToPeers();
    this.transactionPool.on('change', transaction => this.broadcastTransaction(transaction));
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

    this.emit(
      'info',
      `Your server external address is ${this.protocol}://${this.externalDomain}:${this.externalPort}`,
    );
  }

  connectToPeer(
    peerAddress,
    serverProtocol,
    serverDomain,
    serverPort,
    retries = P2P_SOCKET_RECONNECTION_RETRIES,
  ) {
    console.log('-'.repeat(10));
    console.log(`Trying to connect to peer ${peerAddress}`);
    console.log(`Retries remain ${retries}`);
    console.log('-'.repeat(10));

    if (this.outbounds[peerAddress] || this.inbounds[peerAddress]) return;

    const socket = new Websocket(peerAddress);

    this.addServerAddressToSocket(socket, {
      protocol: serverProtocol,
      domain: serverDomain,
      port: serverPort,
    });

    socket.on('open', () => {
      this.connectSocket(socket);
      this.sendPeers(socket);
      this.outbounds[peerAddress] = socket;

      console.log(`Connected to peer: ${peerAddress}`);
      // plus one because of "retries - 1" below
      retries = P2P_SOCKET_RECONNECTION_RETRIES + 1;
    });

    socket.on('error', (err) => {
      console.log(err);
    });

    socket.on('close', () => {
      if (this.outbounds[peerAddress]) {
        this.deleteMiner(this.outbounds[peerAddress].id);
        delete this.outbounds[peerAddress];
        this.deleteMiner(this.outbounds[peerAddress].id);
      }

      if (retries === 0) return;

      setTimeout(
        () => this.connectToPeer(
          peerAddress,
          serverProtocol,
          serverDomain,
          serverPort,
          retries - 1,
        ),
        P2P_SOCKET_RECONNECTION_INTERVAL,
      );
    });
  }

  connectToPeers() {
    while (this.peers.length && this.outboundsQuantity < MAXIMUM_OUTBOUNDS) {
      let peerAddress = this.peers.pop();

      const parsedPeerLink = /(.+):\/\/([\d\w.\-_]+?):(.+)$/gi.exec(peerAddress);
      if (parsedPeerLink) {
        const [, serverProtocol, serverDomain, serverPort] = parsedPeerLink;
        peerAddress = `${serverProtocol}://${serverDomain}:${serverPort}`;
        console.log(peerAddress);
        // EXAMPLE: http://localhost:5001 || ws://localhost:5001
        this.connectToPeer(peerAddress, serverProtocol, serverDomain, serverPort);
      }
    }
    this.peers = [];
  }

  addServerAddressToSocket(socket, { protocol = this.protocol, domain = null, port = null }) {
    socket.serverProtocol = protocol;
    if (domain) socket.serverDomain = domain;
    if (port) socket.serverPort = port;
    if (domain && port) socket.serverAddress = `${protocol}://${domain}:${port}`;
  }

  requestServerExternalAddress(socket, socketExternalAddressObj) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.serverExternalAddressReq,
      socketExternalAddressObj,
    }));
  }

  connectSocket(socket) {
    this.addMsgHandler(socket);
    this.addCloseAndErrorHandler(socket);
    this.sendChain(socket);
    this.sendTransactionPool(socket);
  }

  addCloseAndErrorHandler(socket) {
    // this works only once in retries
    const handler = (err) => {
      if (err instanceof Error) console.log(err);

      const serverAddress = `${socket.serverProtocol}://${socket.serverDomain}:${socket.serverPort}`;

      this.deleteMiner(socket.id);

      if (this.inbounds[serverAddress]) {
        delete this.inbounds[serverAddress];
      }
      if (this.outbounds[serverAddress]) {
        delete this.outbounds[serverAddress];
      }

      if (this.allSocketsQuantity === 0) {
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
      const data = JSON.parse(message);

      switch (data.type) {
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

        case MESSAGE_TYPES.peers:
          this.peers.push(...data.peers);
          this.connectToPeers();
          break;

        case MESSAGE_TYPES.serverExternalAddressReq: {
          const {
            protocol,
            domain: prevDomain,
          } = data.socketExternalAddressObj;

          if (this.ngrokHost === null) {
            this.externalDomain = prevDomain;
            this.externalPort = this.port;

            this.emit(
              'info',
              `Your external address: ${protocol}://${this.externalDomain}:${this.externalPort}`,
            );
          }

          socket.send(JSON.stringify({
            type: MESSAGE_TYPES.serverExternalAddressRes,
            serverAddressObj: {
              protocol: this.protocol,
              domain: this.externalDomain,
              port: this.externalPort,
              address: `${this.protocol}://${this.externalDomain}:${this.externalPort}`,
              serverID: this.id,
            },
          }));
          break;
        }

        case MESSAGE_TYPES.serverExternalAddressRes:
          this.updateInbound(socket, data.serverAddressObj);
          break;

        case MESSAGE_TYPES.miningStarted:
          this.saveMiner(data.minerID);
          break;

        case MESSAGE_TYPES.miningStopped:
          this.deleteMiner(data.minerID);
          break;

        default:
          break;
      }
    });
  }

  sendChain(socket) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.chain,
      chain: this.blockchain.chain,
    }));
  }

  sendTransaction(socket, transaction) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.transaction,
      transaction,
    }));
  }

  sendTransactionPool(socket) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.transactionPool,
      transactionPool: this.transactionPool.transactions,
    }));
  }

  sendPeers(socket) {
    const peers = [
      ...Object.keys(this.inbounds),
      ...Object.keys(this.outbounds),
    ];

    if (peers.length) {
      socket.send(JSON.stringify({
        type: MESSAGE_TYPES.peers,
        peers,
      }));
    }
  }

  sendMiningStarted(socket, minerID) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.miningStarted,
      minerID,
    }));
  }

  sendMiningStopped(socket, minerID) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.miningStopped,
      minerID,
    }));
  }

  updateInbound(socket, serverAddressObj) {
    const {
      port: serverPort,
      address: serverAddress,
      serverID,
    } = serverAddressObj;

    socket.id = serverID;

    // we don't need more than one connection with same user
    if (this.outbounds[serverAddress]) {
      const sameSocket = this.outbounds[serverAddress];
      sameSocket.close();
      delete this.outbounds[serverAddress];
    }

    if (this.inbounds[serverAddress]) {
      const prevSocket = this.inbounds[serverAddress];
      prevSocket.close();

      this.inbounds[serverAddress] = socket;
    } else {
      this.inbounds[serverAddress] = socket;
    }

    if (serverPort !== socket.serverPort) {
      const prevServerAddress = socket.serverAddress;
      delete this.inbounds[prevServerAddress];

      socket.serverPort = serverPort;
    }

    console.log('Inbounds:');
    console.log(this.inbounds);
    console.log('Outbounds:');
    console.log(this.outbounds);

    console.log(`Socket was connected: ${serverAddress}`);
  }

  getSocketExternalAddressObj(req) {
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

    this.saveMiner(minerID);
    this.allSockets.forEach(socket => this.sendMiningStarted(socket, minerID));
  }

  broadcastMiningStopped(minerID = null) {
    if (minerID === null) minerID = this.id;

    this.deleteMiner(minerID);
    this.allSockets.forEach(socket => this.sendMiningStopped(socket, minerID));
  }
}

module.exports = P2pServer;
