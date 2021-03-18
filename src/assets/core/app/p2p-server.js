const Websocket = require('ws');
const { MAXIMUM_INBOUNDS, MAXIMUM_OUTBOUNDS } = require('../config');

let peers = process.env.PEERS ? process.env.PEERS.split(',') : [];
const MESSAGE_TYPES = {
  chain: 'CHAIN',
  transaction: 'TRANSACTION',
  clearTransactions: 'CLEAR_TRANSACTIONS',
  transactionPool: 'TRANSACTION_POOL',
  peers: 'PEERS',
  serverPortReq: 'SERVER_PORT_REQUEST',
  serverPortRes: 'SERVER_PORT_RESPONSE'
};


class P2pServer {
  constructor(blockchain, transactionPool) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.inbounds = {};
    this.outbounds = {};
    this.outboundsQuantity = 0;
    this.inboundsQuantity = 0;
    this.server = null;
  }

  listen({ host = '127.0.0.1', port, httpServer = null }, cb = null) {
    const serverOpts = httpServer === null
      ? { host, port }
      : { server: httpServer, noServer: false };

    this.server = new Websocket.Server(serverOpts);
    this.server.on('connection', (socket, req) => {
      this.sendPeers(socket);

      if (this.inboundsQuantity < MAXIMUM_INBOUNDS) {
        this.connectSocket(socket);
        this.requestServerPort(socket, req);
      }
    });
    this.server.on('error', (err) => console.log(err));

    this.connectToPeers();
    this.transactionPool.on('change', transaction => this.broadcastTransaction(transaction))
    if (cb !== null) cb();
  }

  connectToPeers() {
    while (peers.length && this.outboundsQuantity < MAXIMUM_OUTBOUNDS) {
      const peer = peers.pop();

      // ws://localhost:5001
      if (!this.outbounds[peer]) {
        const socket = new Websocket(peer);

        [, socket.serverAddress, socket.serverPort] =
          /:\/\/(.+?):(.+)$/gi.exec(peer);

        socket.on('open', () => {
          this.connectSocket(socket);
          this.outbounds[peer] = socket;
          this.outboundsQuantity += 1;
          console.log(`Connected to peer: ${ peer }`);
        });
        socket.on('error', () => {
          if (this.outbounds[peer]) {
            delete this.outbounds[peer];
            this.outboundsQuantity -= 1;
          }
        })
      }
    }
    peers = [];
  }

  requestServerPort(socket, req) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.serverPortReq,
      serverAddress: this.getSocketAddress(req),
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
          peers.push(...data.peers);
          this.connectToPeers();
          break;
        case MESSAGE_TYPES.serverPortReq:
          socket.send(JSON.stringify({
            type: MESSAGE_TYPES.serverPortRes,
            serverPort: this.server.address().port,
            serverAddress: data.serverAddress,
          }));
          break;
        case MESSAGE_TYPES.serverPortRes:
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

    let fullAddress = `http://${ serverAddress }:${ serverPort }`;
    if (!this.inbounds[fullAddress]) {

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
}

module.exports = P2pServer;
