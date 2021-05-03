const P2P_SERVER_TYPES = {
  START_SERVER: 'start-server',
  INFO_ALERT: 'info-alert',
  WARNING_ALERT: 'warning-alert',
  ERROR_ALERT: 'error-alert',
  ALERT: 'p2p-alert',
  SUCCESS_ALERT: 'success-alert',
  SERVER_STARTED: 'server-started',
  PROPERTY_CHANGED: 'property-changed',
  INBOUNDS_LIST_CHANGED: 'inbounds-list-changed',
  OUTBOUNDS_LIST_CHANGED: 'outbounds-list-changed',
  STOP_SERVER: 'stop-server',
  NEW_BLOCK_ADDED: 'new_block_added',
  TRANSACTION_POOL_CHANGED: 'transaction-pool-changed',
  ERROR: 'p2p-server-error',
};

const MINING_TYPES = {
  START_MINING: 'start-mining',
  STOP_MINING: 'stop-mining',
  BLOCK_HAS_CALCULATED: 'block-has-calculated',
  ERROR: 'mining-error',
};

module.exports = {
  P2P_SERVER_TYPES,
  MINING_TYPES,
};
