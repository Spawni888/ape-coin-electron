const { EventEmitter } = require('events');
const { ipcRenderer } = require('electron');
const { cloneDeep } = require('lodash');
const Transaction = require('../wallet/transaction');

class Miner extends EventEmitter {
  constructor(blockchain, transactionPool, wallet) {
    super();
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
  }

  startMining() {
    const pickedTransactions = this.transactionPool.pickTransactions();
    const rewardTransaction = Transaction.rewardTransaction(
      this.wallet,
      pickedTransactions,
      this.blockchain,
    );
    pickedTransactions.push(rewardTransaction);

    ipcRenderer.send('start-mining', {
      pickedTransactions: cloneDeep(pickedTransactions),
      blockchain: cloneDeep(this.blockchain),
    });

    return pickedTransactions;
  }

  mine() {
    this.startMining();

    ipcRenderer.on('block-has-calculated', (event, { block }) => {
      this.emit('newBlock', block);

      setTimeout(this.startMining.bind(this), 0);
    });
    ipcRenderer.on('mining-error', (event, { error }) => {
      this.emit('error', error);
    });
  }

  stopMining() {
    ipcRenderer.send('stop-mining');
    ipcRenderer.removeAllListeners('block-has-calculated');
    ipcRenderer.removeAllListeners('mining-error');
  }
}

module.exports = Miner;
