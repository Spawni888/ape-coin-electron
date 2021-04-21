const WSS_TYPES = {
  START_SERVER: 'start-server',
  CONNECTION: 'connection',
  ERROR: 'error',
};

const MINING_TYPES = {
  START_MINING: 'start-mining',
  BLOCK_HAS_CALCULATED: 'block-has-calculated',
  ERROR: 'mining-error',
};

module.exports = {
  WSS_TYPES,
  MINING_TYPES,
};
