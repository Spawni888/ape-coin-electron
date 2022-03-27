const Websocket = require('ws');
const { EventEmitter } = require('events');
const ngrok = require('ngrok');
const { MAXIMUM_INBOUNDS, MAXIMUM_OUTBOUNDS } = require('../config');

const MESSAGE_TYPES = {
  chain: 'CHAIN',
  transaction: 'TRANSACTION',
  clearTransactions: 'CLEAR_TRANSACTIONS',
  transactionPool: 'TRANSACTION_POOL',
  peers: 'PEERS',
  serverAddressReq: 'SERVER_ADDRESS_REQUEST',
  serverAddressRes: 'SERVER_ADDRESS_RESPONSE',
  replaceAddressWithNgrok: 'REPLACE_ADDRESS_WITH_NGROK',
  disconnection: 'DISCONNECT_ME',
};

class P2pServer extends EventEmitter {
  constructor(blockchain, transactionPool) {
    super();
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.inbounds = {};
    this.outbounds = {};
    this.outboundsQuantity = 0;
    this.inboundsQuantity = 0;
    this.server = null;
    this.host = null;
    this.port = null;
    this.externalAddress = null;
    this.externalPort = null;
    this.ngrokAddress = null;
    this.peers = [];
  }

  get myPeerLink() {
    if (this.externalAddress === null) return null;

    return `http://${this.externalAddress}:${this.externalPort}`;
  }

  get inboundsList() {
    return Object.keys(this.inbounds);
  }

  get outboundsList() {
    return Object.keys(this.outbounds);
  }

  close() {
    this.server.close();
  }

  listen({
    host = '127.0.0.1', port, ngrokAuthToken = null, peers,
  }, cb = null) {
    this.port = port;
    this.host = host;
    this.peers = peers;

    if (ngrokAuthToken !== null) {
      this.ngrokConnect(ngrokAuthToken);
    }

    this.server = new Websocket.Server({ host, port });
    this.server.on('connection', (socket, req) => {
      this.sendPeers(socket);

      if (this.inboundsQuantity < MAXIMUM_INBOUNDS) {
        this.connectSocket(socket);
        this.requestServerAddress(socket, req);
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
      http://${this.host}:${this.port}`,
    );
    if (cb !== null) cb();
  }

  ngrokConnect(ngrokAuthToken) {
    (async () => {
      try {
        this.ngrokAddress = await ngrok.connect({
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
      this.ngrokAddress = this.ngrokAddress.replace(/^https?:\/\//g, '');
      this.externalAddress = this.ngrokAddress;
      this.externalPort = '80';

      this.emit(
        'info',
        `Your server external address is http://${this.ngrokAddress}:80`,
      );
    })();
  }

  connectToPeer(peer, serverAddress, serverPort, retries = 10) {
    if (retries <= 0) return;
    if (this.outbounds[peer] || this.inbounds[peer]) return;
    const reconnectInterval = 5000;
    const socket = new Websocket(peer);

    socket.serverAddress = serverAddress;
    socket.serverPort = serverPort;

    socket.on('open', () => {
      this.connectSocket(socket);
      this.sendPeers(socket);
      this.outbounds[peer] = socket;
      this.outboundsQuantity += 1;
      console.log(`Connected to peer: ${peer}`);
    });

    socket.on('error', (err) => {
      // TODO: Look at its work ?!
      console.log(err);
      if (err.message !== 'Unexpected server response: 404') return;
      retries = 0;
    });

    socket.on('close', () => {
      if (this.outbounds[peer]) {
        delete this.outbounds[peer];
        this.outboundsQuantity -= 1;
      }
      if (this.allSockets().length > 0) {
        this.emit('info', `Connection with peer ${peer} was broken.`);
      } else {
        this.emit(
          'warning',
          `Connection with peer ${peer} was broken. It was your last connection`,
        );
      }
      setImmediate(
        () => this.connectToPeer(peer, serverAddress, serverPort, retries - 1), reconnectInterval,
      );
    });
  }

  connectToPeers() {
    while (this.peers.length && this.outboundsQuantity < MAXIMUM_OUTBOUNDS) {
      let peer = this.peers.pop();

      const parsedPeerLink = /:\/\/([\d\w.\-_]+?):(.+)$/gi.exec(peer);
      if (parsedPeerLink) {
        const [, serverAddress, serverPort] = parsedPeerLink;
        peer = `http://${serverAddress}:${serverPort}`;

        // EXAMPLE: http://localhost:5001 || ws://localhost:5001
        this.connectToPeer(peer, serverAddress, serverPort);
      }
    }
    this.peers = [];
  }

  requestServerAddress(socket, req) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.serverAddressReq,
      prevAddress: this.getSocketAddress(req),
    }));
  }

  connectSocket(socket) {
    this.addMsgHandler(socket);
    this.addCloseAndErrorHandler(socket);
    this.sendChain(socket);
    this.sendTransactionPool(socket);
  }

  addCloseAndErrorHandler(socket) {
    const handler = () => {
      const fullAddress = `http://${socket.serverAddress}:${socket.serverPort}`;

      if (this.inbounds[fullAddress]) {
        delete this.inbounds[fullAddress];
        this.inboundsQuantity -= 1;
      }
      if (this.outbounds[fullAddress]) {
        delete this.outbounds[fullAddress];
        this.outboundsQuantity -= 1;
      }
      console.log(`Socket was disconnected: ${fullAddress}`);
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

        case MESSAGE_TYPES.serverAddressReq:
          if (this.ngrokAddress === null) {
            this.externalAddress = data.prevAddress;
            this.externalPort = this.port;

            this.emit(
              'info',
              `Your external address: http://${this.externalAddress}:${this.externalPort}`,
            );
          }

          socket.send(JSON.stringify({
            type: MESSAGE_TYPES.serverAddressRes,
            serverPort: this.externalPort,
            serverAddress: this.externalAddress,
          }));
          break;
        case MESSAGE_TYPES.serverAddressRes:
          this.saveInbound(socket, data.serverAddress, data.serverPort);
          break;

        case MESSAGE_TYPES.disconnection:
          if (!this.inbounds[data.peer]) return;
          delete this.inbounds[data.peer];
          this.inboundsQuantity -= 1;
          this.emit('info', `Connection with peer ${data.peer} was broken.`);
          break;

        case MESSAGE_TYPES.clearTransactions:
          this.transactionPool.clear();
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

  sendClearTransactions(socket) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.clearTransactions,
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

  sendDisconnection(socket, peer) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.disconnection,
      peer,
    }));
  }

  saveInbound(socket, serverAddress, serverPort) {
    socket.serverAddress = serverAddress;
    socket.serverPort = serverPort;

    const fullAddress = `http://${serverAddress}:${serverPort}`;
    if (!this.inbounds[fullAddress] && !this.outbounds[fullAddress]) {
      this.inbounds[fullAddress] = socket;
      this.inboundsQuantity += 1;
      console.log(`Socket was connected: ${fullAddress}`);
    }
  }

  getSocketAddress(req) {
    return (req.headers['x-forwarded-for'] || '').split(',')[0]
      || req.connection.remoteAddress;
  }

  allSockets() {
    return [...(Object.values(this.inbounds)), ...Object.values(this.outbounds)];
  }

  syncChains() {
    this.allSockets().forEach(socket => this.sendChain(socket));
  }

  broadcastTransaction(transaction) {
    this.allSockets().forEach(socket => this.sendTransaction(socket, transaction));
  }

  allPeersLinks() {
    return [...Object.keys(this.inbounds), ...Object.keys(this.outbounds)];
  }
}

module.exports = P2pServer;
