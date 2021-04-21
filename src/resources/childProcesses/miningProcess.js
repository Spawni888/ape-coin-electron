const { MINING_TYPES } = require('../constants');
const Blockchain = require('../core/blockchain/index');

try {
  process.on('message', ({
    type,
    data,
  }) => {
    switch (type) {
      case MINING_TYPES.START_MINING: {
        const { pickedTransactions, blockchain } = data;
        const block = Blockchain.addBlock(blockchain, pickedTransactions);

        process.send({
          type: MINING_TYPES.BLOCK_HAS_CALCULATED,
          data: { block },
        });
        break;
      }
      default:
        break;
    }
  });
} catch (error) {
  process.send({
    type: MINING_TYPES.ERROR,
    data: {
      error,
    },
  });
}
