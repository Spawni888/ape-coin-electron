const { MINE_TYPES } = require('../constants');

try {
  process.send({
    type: 'test',
    data: 'test',
  });
  const { pickedTransactions, blockchain } = process.env;

  const block = blockchain.addBlock(pickedTransactions);
  process.send({
    type: MINE_TYPES.BLOCK_HAS_CALCULATED,
    data: { block },
  });
} catch (error) {
  process.send({
    type: MINE_TYPES.ERROR,
    data: {
      error,
    },
  });
}
