const WSS_TYPES = {
  START_SERVER: 'start-server',
  CONNECTION: 'connection',
  ERROR: 'error',
};

const MINE_TYPES = {
  START_MINING: 'start-mining',
  BLOCK_HAS_CALCULATED: 'block-has-calculated',
  ERROR: 'mining-error',
};

module.exports = {
  WSS_TYPES,
  MINE_TYPES,
};
