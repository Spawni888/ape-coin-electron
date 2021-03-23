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

  listen({host = '127.0.0.1', port, httpServer = null, ngrokApiKey = null, peers}, cb = null) {
    const serverOpts = httpServer === null
      ? { host, port }
      : { server: httpServer, noServer: false };
    this.port = port;
    this.host = host;
    this.peers = peers;

    if (ngrokApiKey !== null) {
      this.ngrokConnect(ngrokApiKey);
    }

    this.server = new Websocket.Server(serverOpts);
    this.server.on('connection', (socket, req) => {
      this.sendPeers(socket);

      if (this.inboundsQuantity < MAXIMUM_INBOUNDS) {
        this.connectSocket(socket);
        this.requestServerAddress(socket, req);
      }
    });
    this.server.on('error', (err) => {
      this.emit('error', `Error occurred during P2P-server listening...`);
      console.log(err)
    });
    this.connectToPeers();
    this.transactionPool.on('change', transaction => this.broadcastTransaction(transaction))
    if (cb !== null) cb();
    this.emit(
      'success',
      `Your server was creates successfully. Your internal address:
      http://${this.host}:${this.port}`
    );
  }

  ngrokConnect(ngrokApiToken) {
    (async () => {
      try {
        this.ngrokAddress = await ngrok.connect({
          proto: 'http', // http|tcp|tls, defaults to http
          addr: `${ this.host }:${ this.port }`, // port or network address, defaults to 80
          authtoken: ngrokApiToken, // your authtoken from ngrok.com
          region: 'us', // one of ngrok regions (us, eu, au, ap, sa, jp, in), defaults to us
          onStatusChange: status => {
            if (status === 'closed') {
              this.ngrokConnect(ngrokApiToken);
            }
          }, // 'closed' - connection is lost, 'connected' - reconnected
        });
      }
      catch (e) {
        console.log(e);
        this.emit('error', `Can't connect ngrok. Check your ngrok API key.`);
        return;
      }
      this.ngrokAddress = this.ngrokAddress.replace(/^https?:\/\//g, '');

      this.emit(
        'info',
        `Your server external address is http://${this.ngrokAddress}:80`,
      );
    })();
  }

  connectToPeers() {
    while (this.peers.length && this.outboundsQuantity < MAXIMUM_OUTBOUNDS) {
      let peer = this.peers.pop();

      const [, serverAddress, serverPort] =
        /:\/\/([\d\w.]+?):(.+)$/gi.exec(peer);
      peer = `http://${ serverAddress }:${ serverPort }`;

      // ws://localhost:5001
      if (!this.outbounds[peer] && !this.inbounds[peer]) {
        const socket = new Websocket(peer);

        socket.serverAddress = serverAddress;
        socket.serverPort = serverPort;

        socket.on('open', () => {
          this.connectSocket(socket);
          this.sendPeers(socket);
          this.outbounds[peer] = socket;
          this.outboundsQuantity += 1;
          console.log(`Connected to peer: ${ peer }`);
        });
        socket.on('close', () => {
          if (this.outbounds[peer]) {
            delete this.outbounds[peer];
            this.outboundsQuantity -= 1;
          }
          if (this.allSockets().length > 0) {
            emit('info', `Connection with peer ${peer} was broken.`)
          } else {
            emit(
              'error',
              `Connection with peer ${peer} was broken. Server was closed. It was your last connection`
            );
          }
        });
        socket.on('error', () => {
          if (this.outbounds[peer]) {
            delete this.outbounds[peer];
            this.outboundsQuantity -= 1;
            emit('warning', `Connection with peer ${peer} threw error and was broken`);
          }
        })
      }
    }
    this.peers = [];
  }

  requestServerAddress(socket, req) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.serverAddressReq,
      prevAddress: this.getSocketAddress(req),
    }))
  }

  connectSocket(socket) {
    this.addMsgHandler(socket);
    this.addCloseHandler(socket);
    this.sendChain(socket);
    this.sendTransactionPool(socket);
  }

  addCloseHandler(socket) {
    socket.on('close', () => {
      let fullAddress = `http://${ socket.serverAddress }:${ socket.serverPort }`;

      if (this.inbounds[fullAddress]) {
        delete this.inbounds[fullAddress];
        this.inboundsQuantity -= 1;
      }
      if (this.outbounds[fullAddress]) {
        delete this.outbounds[fullAddress];
        this.outboundsQuantity -= 1;
      }
      console.log(`Socket was disconnected: ${fullAddress}`);
    });
  }

  addMsgHandler(socket) {
    socket.on('message', message => {
      const data = JSON.parse(message);

      switch (data.type) {
        case MESSAGE_TYPES.chain:
          this.blockchain.replaceChain(data.chain);
          break;
        case MESSAGE_TYPES.transaction:
          this.transactionPool.updateOrAddTransaction(data.transaction);
          this.transactionPool.emit('changed');
          break;
        case MESSAGE_TYPES.clearTransactions:
          this.transactionPool.clear();
          break;
        case MESSAGE_TYPES.transactionPool:
          for (let transaction of data.transactionPool) {
            this.transactionPool.updateOrAddTransaction(transaction);
          }
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
              `Your external address: http://${this.externalAddress}:${this.externalPort}`
            );
          } else {
            this.externalAddress = this.ngrokAddress;
            this.externalPort = '80';
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
      }
    })
  }

  sendChain(socket) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.chain,
      chain: this.blockchain.chain
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
    }))
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

  saveInbound(socket, serverAddress, serverPort) {
    socket.serverAddress = serverAddress;
    socket.serverPort = serverPort;

    let fullAddress = `
          }http://${ serverAddress }:${ serverPort }`;
    if (!this.inbounds[fullAddress] && !this.outbounds[fullAddress]) {

      this.inbounds[fullAddress] = socket;
      this.inboundsQuantity += 1;
      console.log(`Socket was connected: ${ fullAddress }`);
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

  broadcastClearTransactions() {
    this.allSockets().forEach(socket => this.sendClearTransactions(socket));
  }

  myPeerLink() {
    const serverAddress = (this.ngrokAddress !== null ? this.ngrokAddress : this.host);
    const port = (this.ngrokAddress !== null ? '80' : this.port);
    return `http://${ serverAddress }:${ port }`;
  }

  allPeersLinks() {
    return [...Object.keys(this.inbounds), ...Object.keys(this.outbounds)];
  }
}

module.exports = P2pServer;
