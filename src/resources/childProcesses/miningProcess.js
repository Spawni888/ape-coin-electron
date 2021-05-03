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
          data: {
            block: {
              timestamp: block.timestamp,
              lastHash: block.lastHash,
              hash: block.hash,
              data: block.data,
              nonce: block.nonce,
              difficulty: block.difficulty,
            },
          },
        });
        break;
      }
      // case MINING_TYPES.STOP_MINING: {
      //   process.exit(0);
      //   break;
      // }
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
