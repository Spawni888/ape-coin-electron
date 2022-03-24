const FROM_P2P = {
  ALERT: 'p2p-alert',
  SERVER_STARTED: 'p2p-server-started',
  SERVER_STOPPED: 'p2p-server-stopped',
  PROPERTY_CHANGED: 'property-changed',
  INBOUNDS_LIST_CHANGED: 'inbounds-list-changed',
  OUTBOUNDS_LIST_CHANGED: 'outbounds-list-changed',
  TRANSACTION_POOL_CHANGED: 'transaction-pool-changed',
  TO_UI: 'from-p2p-to-ui',
  ERROR: 'p2p-server-error',
  CONSOLE_LOG: 'console-log',
};

const TO_P2P = {
  START_SERVER: 'to-p2p-start-server',
  NEW_BLOCK_ADDED: 'new_block_added',
};

const TO_MINING = {
  START_MINING: 'start-mining',
  STOP_MINING: 'stop-mining',
};

const FROM_MINING = {
  BLOCK_HAS_CALCULATED: 'block-has-calculated',
  ERROR: 'mining-error',
  TO_UI: 'from-mining-to-ui',
  MINING_STOPPED: 'mining_stopped',
};

const FROM_BG = {
  CONSOLE_LOG: 'console-log',
  ALERT: 'from-bg-alert',
  SIGN_IN_WALLET: 'sign-in-wallet',
  LOAD_P2P_FORM: 'load-p2p-form',
  WALLET_CREATED: 'wallet-created',
};

const TO_BG = {
  START_P2P_SERVER: 'start-p2p-server',
  STOP_P2P_SERVER: 'stop-p2p-server',
  START_MINING: 'to-bg-start-mining',
  STOP_MINING: 'to-bg-stop-mining',
  CHECK_AUTH_SAVING: 'check-auth-saving',
  SAVE_P2P_FORM: 'save-p2p-form',
  CHECK_P2P_FORM_SAVING: 'check-p2p-form-saving',
  CREATE_WALLET: 'create-wallet',
};

const FROM_APP = {
  ALERT: 'app-alert',
};

module.exports = {
  FROM_P2P,
  TO_P2P,
  FROM_MINING,
  TO_MINING,
  FROM_BG,
  TO_BG,
  FROM_APP,
};
