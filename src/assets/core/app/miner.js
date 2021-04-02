const Transaction = require('../wallet/transaction');
const Block = require('../blockchain/block');
const { MINING_MODES } = require('../constants');

class Miner {
  constructor(blockchain, transactionPool, wallet, p2pServer) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.p2pServer = p2pServer;
  }

  async mine() {
    let miningMode = MINING_MODES.REPEAT_MINING;
    let block = null;

    while (miningMode === MINING_MODES.REPEAT_MINING) {
      let pickedTransactions = this.transactionPool.pickTransactions();

      let rewardTransaction = Transaction.rewardTransaction(this.wallet, pickedTransactions, this.blockchain);
      pickedTransactions.push(rewardTransaction);

      const miningInfo = await this.blockchain.addBlock(pickedTransactions, this.transactionPool);

      miningMode = miningInfo.mode;
      if (miningMode === MINING_MODES.STOP_MINING) {
        return null;
      }
      if (miningMode === MINING_MODES.ADD_BLOCK) {
        block = miningInfo.block;
      }
    }
    this.p2pServer.syncChains();
    this.transactionPool.clear();

    return block;
  }
}

module.exports = Miner;
