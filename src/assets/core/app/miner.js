const { fork } = require('child_process');
const { EventEmitter } = require('events');
const { MINE_TYPES, RESOURCES_PATH } = require('@/resources/constants');
const Transaction = require('../wallet/transaction');
const path = require('path');

class Miner extends EventEmitter {
  constructor(blockchain, transactionPool, wallet, p2pServer) {
    super();
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.p2pServer = p2pServer;
    this.miningProcess = null;
  }

  mine() {
    let pickedTransactions = this.transactionPool.pickTransactions();
    let rewardTransaction = Transaction.rewardTransaction(this.wallet, pickedTransactions, this.blockchain);
    pickedTransactions.push(rewardTransaction);

    this.miningProcess = fork(path.join(RESOURCES_PATH, '/childProcesses/miningProcess.js'), {
      env: {
        pickedTransactions,
        blockchain: this.blockchain,
      }
    });

    this.miningProcess.on('message', ({
      type,
      data
    }) => {
      console.log(type, data);
      switch (type) {
        case MINE_TYPES.BLOCK_HAS_CALCULATED:
          this.emit('newBlock', data.block);
          this.p2pServer.syncChains();
          this.transactionPool.clear();
          break;
        case MINE_TYPES.ERROR:
          this.emit('error', data.error);
          break;
        case 'test':
          console.log(data);
          break;
      }
    });

    return this.miningProcess;
  }

  stopMining() {
    this.miningProcess.kill();
    this.miningProcess = null;
  }
}

module.exports = Miner;
