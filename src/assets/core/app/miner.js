const Transaction = require('../wallet/transaction');

class Miner {
  constructor(blockchain, transactionPool, wallet, p2pServer) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.p2pServer = p2pServer;
  }

  async mine() {
    let block = null;

    while (block === null) {
      let pickedTransactions = this.transactionPool.pickTransactions();

      let rewardTransaction = Transaction.rewardTransaction(this.wallet, pickedTransactions, this.blockchain);
      pickedTransactions.push(rewardTransaction);

      block = await this.blockchain.addBlock(pickedTransactions, this.transactionPool);
    }

    this.p2pServer.syncChains();
    this.transactionPool.clear();
    this.p2pServer.broadcastClearTransactions();

    return block;
  }
}

module.exports = Miner;
