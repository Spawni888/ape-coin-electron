import { createStore } from 'vuex';
import Blockchain from '@/resources/core/blockchain';
import TransactionPool from '@/resources/core/wallet/transactionPool';
import Wallet from '@/resources/core/wallet';
import Block from '@/resources/core/blockchain/block';
import ChainUtil from '@/resources/core/chain-util';
import portfinder from 'portfinder';
import { ipcRenderer } from 'electron';
import { BLOCKCHAIN_WALLET } from '@/resources/core/config';
import {
  TO_BG,
  FROM_P2P,
  FROM_BG,
  FROM_APP, FROM_MINING,
  TO_P2P, FROM_UI,
} from '@/resources/channels';
import uuid from 'uuid';
// eslint-disable-next-line import/no-cycle
import { routeTo } from '@/router';
import Transaction from '@/resources/core/wallet/transaction';

export default createStore({
  state: {
    p2pServer: {
      inboundsList: [],
      outboundsList: [],
      host: null,
      port: null,
      protocol: 'http',
      externalDomain: null,
      externalPort: null,
      externalAddress: null,
      ngrokHost: null,
      peers: [],
      savedPeers: [],
    },
    transactions: {
      walletRelatedTransactions: [],
      selectedWalletBalance: 0,
      selectedWalletAddress: null,
    },
    mining: {
      miners: [1],
      difficulty: 4,
      hashRate: 0,
      feeThreshold: 0,
      startTime: 0,
      rewardTransaction: null,
    },
    appUpdate: {
      isUpdating: false,
      bytesPerSecond: 0,
      percent: 0,
      releaseName: 'Turbo Update',
      modalIsShowing: false,
    },
    blockchain: null,
    transactionPool: null,
    wallet: null,
    serverIsUp: false,
    alertQueue: [],
    alertsJournal: [],
    alertIsShowing: false,
    alertTimer: null,
    alertInfo: {
      type: 'error',
      title: 'Error',
      message: 'Try again later...',
      timestamp: 0,
    },
    transactionPending: false,
    miningIsUp: false,
  },
  getters: {
    walletRelatedTransactions(state) {
      return state.transactions.walletRelatedTransactions;
    },
    selectedWalletBalance(state) {
      return Math.floor(state.transactions.selectedWalletBalance * 100) / 100;
    },
    selectedWalletAddress(state) {
      return state.transactions.selectedWalletAddress;
    },
    alertIsShowing(state) {
      return state.alertIsShowing;
    },
    alertInfo(state) {
      return state.alertInfo;
    },
    alertsJournal(state) {
      return state.alertsJournal;
    },
    p2pInboundsQuantity(state) {
      return state.p2pServer.inboundsList.length;
    },
    p2pOutboundsQuantity(state) {
      return state.p2pServer.outboundsList.length;
    },
    p2pInboundsList(state) {
      return state.p2pServer.inboundsList;
    },
    p2pOutboundsList(state) {
      return state.p2pServer.outboundsList;
    },
    myPeerLink(state) {
      // it works because of p2pServer.html Proxy and FROM_P2P.PROPERTY_CHANGED channel.
      const { p2pServer } = state;
      if (p2pServer.externalDomain === null) return null;

      return `${p2pServer.protocol}://${p2pServer.externalDomain}:${p2pServer.externalPort}`;
    },
    serverIsUp(state) {
      return state.serverIsUp;
    },
    walletAuthed(state) {
      return state.wallet !== null;
    },
    walletPublicKey(state) {
      return state.wallet.publicKey;
    },
    walletBalance(state) {
      return Math.floor(state.wallet?.balanceWithTpIncluded * 100) / 100;
    },
    walletPubKey(state) {
      if (state.wallet === null) return null;
      return state.wallet.publicKey;
    },
    miningIsUp(state) {
      return state.miningIsUp;
    },
    blockchain(state) {
      return state.blockchain?.chain;
    },
    minersNum(state) {
      return state.mining.miners.length;
    },
    miningDifficulty(state) {
      return state.mining.difficulty;
    },
    hashRate(state) {
      return state.mining.hashRate;
    },
    miningStartTime(state) {
      return state.mining.startTime;
    },
    miningReward(state) {
      return state.mining.rewardTransaction.outputs[0].amount;
    },
    appIsUpdating(state) {
      return state.appUpdate.isUpdating;
    },
    updateSpeed(state) {
      return state.appUpdate.bytesPerSecond;
    },
    updatingProgress(state) {
      return state.appUpdate.percent;
    },
    updateModalIsUp(state) {
      return state.appUpdate.modalIsShowing;
    },
    updateReleaseName(state) {
      return state.appUpdate.releaseName;
    },
    lastBlock(state) {
      return state.blockchain?.getLastBlock();
    },
  },
  mutations: {
    setFeeThreshold(state, feeThreshold) {
      state.mining.feeThreshold = feeThreshold;
    },
    adjustDifficulty(state) {
      state.mining.difficulty = Block.adjustDifficulty(state.blockchain.getLastBlock(), Date.now());
    },
    logOutWallet(state) {
      state.wallet = null;
    },
    saveAlertsJournal(state) {
      ipcRenderer.send(TO_BG.SAVE_ALERTS, JSON.stringify(state.alertsJournal));
    },
    recalculateBalance(state) {
      if (state.wallet === null) return;

      state.wallet.balance = state.wallet.calculateBalance(state.blockchain);
      state.wallet.calculateBalanceWithTpIncluded(state.transactionPool);
    },
    sendToP2P(state, { channel, data }) {
      ipcRenderer.send(FROM_UI.TO_P2P, JSON.stringify({ channel, data }));
    },
    findWalletRelatedTransactions(state, {
      pubKey = null,
      bcStart,
      bcEnd,
    }) {
      if (pubKey === null) return;

      state.transactions.selectedWalletAddress = pubKey;
      state.transactions.walletRelatedTransactions = Wallet.getNewWalletRelatedTransactions(
        pubKey,
        {
          bc: state.blockchain.chain,
          tp: state.transactionPool.transactions,
          bcStart,
          bcEnd,
        },
      );
      state.transactions.walletRelatedTransactions = state.transactions.walletRelatedTransactions
        .sort((a, b) => b.input.timestamp - a.input.timestamp);
    },
    getBalanceTPIncludedOf(state, pubKey) {
      state.transactions.selectedWalletBalance = Wallet.calculateBalanceWithTpIncluded(
        state.transactionPool,
        Wallet.calculateBalance(state.blockchain, pubKey),
        pubKey,
      );
    },
    finishAppUpdate(state) {
      state.appUpdate.modalIsShowing = false;
      state.appUpdate.isUpdating = false;
    },
    setMiningStartTime(state) {
      state.mining.startTime = Date.now();
    },
    savePeers(state) {
      state.p2pServer.savedPeers = [
        ...state.p2pServer.inboundsList
          .filter(peer => peer.available)
          .map(peer => peer.address),
        ...state.p2pServer.outboundsList
          .map(peer => peer.address),
      ];
      ipcRenderer.send(TO_BG.SAVE_PEERS, JSON.stringify(state.p2pServer.savedPeers));
    },
  },
  actions: {
    clearAlertsJournal({ state, commit }) {
      state.alertsJournal = [];
      commit('saveAlertsJournal');
    },
    showAlert({ state, commit }, alertInfo = null) {
      if (alertInfo !== null) {
        alertInfo.timestamp = Date.now();
        alertInfo.id = uuid.v1();

        const sameAlertAlreadyExists = state.alertQueue.find(
          alert => (alert.message === alertInfo.message) && (alert.type === alertInfo.type),
        );
        if (sameAlertAlreadyExists !== undefined) return;

        state.alertQueue.push(alertInfo);
        state.alertsJournal.push(alertInfo);

        state.alertsJournal = state.alertsJournal.sort((a, b) => b.timestamp - a.timestamp);
        commit('saveAlertsJournal');
      }

      if (state.alertTimer) return;

      const intervalFunc = () => {
        if (state.alertQueue.length > 0) {
          state.alertInfo = state.alertQueue.shift();
        } else {
          clearInterval(state.alertTimer);
          state.alertTimer = null;
          state.alertIsShowing = false;
        }
      };
      intervalFunc();
      state.alertIsShowing = true;
      state.alertTimer = setInterval(intervalFunc, 5000);
    },
    initBackgroundListeners({ state, commit, dispatch }) {
      // JUST LOGS
      ipcRenderer.on(FROM_BG.CONSOLE_LOG, (event, data) => {
        console.log(JSON.stringify(data));
      });

      // -------------------------------------------------------------------------------------------
      // Preload saves
      // -------------------------------------------------------------------------------------------
      // peers
      ipcRenderer.on(FROM_BG.LOAD_PEERS, (event, peers) => {
        state.p2pServer.savedPeers = peers;
      });
      // alerts
      ipcRenderer.on(FROM_BG.LOAD_ALERTS, (event, alertsJournal) => {
        state.alertsJournal = alertsJournal;
      });

      // -------------------------------------------------------------------------------------------
      // Updates
      // -------------------------------------------------------------------------------------------
      ipcRenderer.on(FROM_BG.APP_UPDATE_AVAILABLE, () => {
        state.appUpdate.isUpdating = true;
      });
      ipcRenderer.on(FROM_BG.APP_UPDATE_PROGRESS, (event, { percent, bytesPerSecond }) => {
        if (percent) state.appUpdate.percent = percent;
        if (bytesPerSecond) state.appUpdate.bytesPerSecond = bytesPerSecond;
      });
      ipcRenderer.on(FROM_BG.APP_UPDATE_DOWNLOADED, (event, { releaseName }) => {
        if (releaseName) state.appUpdate.releaseName = releaseName;
        state.appUpdate.modalIsShowing = true;
      });

      // -------------------------------------------------------------------------------------------
      // Server info
      // -------------------------------------------------------------------------------------------
      ipcRenderer.on(FROM_P2P.SERVER_STARTED, (event, { serverPort }) => {
        state.serverIsUp = true;
        // check information savings
        // if keepLoggedIn was turned on the wallet will sign in
        ipcRenderer.send(TO_BG.CHECK_AUTH_SAVING);
        console.log(`Listening for peer-to-peer connections on: ${serverPort}`);
      });

      ipcRenderer.on(FROM_P2P.SERVER_STOPPED, () => {
        dispatch('showAlert', {
          type: 'warning',
          title: 'Warning',
          message: 'Server Process exited!',
        });

        dispatch('closeServer');
      });

      // p2p-server property changes
      ipcRenderer.on(FROM_P2P.BLOCKCHAIN_CHANGED, (event, { chain }) => {
        if (!chain) return;
        console.log('FROM_P2P.BLOCKCHAIN_CHANGED:');
        console.log(chain);
        console.log('-'.repeat(10));

        for (let i = state.blockchain.chain.length - 1; i >= 0; i--) {
          state.blockchain.chain.pop();
        }
        chain.forEach(block => {
          state.blockchain.chain.push(new Block(...Object.values(block)));
        });

        state.transactionPool.clear(chain);
        commit('recalculateBalance');

        // alert if you farmed this block
        const lastBlock = chain[chain.length - 1];
        const reward = lastBlock.data
          .find(transaction => transaction.input.address === BLOCKCHAIN_WALLET)
          ?.outputs
          .find(output => output.address === state.wallet.publicKey)
          ?.amount;

        if (reward) {
          dispatch('showAlert', {
            type: 'success',
            title: 'Success',
            message: `You have mine block with difficulty: ${lastBlock.difficulty} and earn ${reward} coins!`,
          });
        }

        if (!state.miningIsUp) return;
        setTimeout(() => dispatch('startMining', { silenceMode: true }), 0);
      });

      ipcRenderer.on(FROM_P2P.PROPERTY_CHANGED, (event, data) => {
        const {
          prop,
          value,
        } = data;

        if (prop === 'blockchain') {
          state[prop].chain = value.chain;
          return;
        }
        if (prop === 'transactionPool') {
          state[prop].transactions = value.transactions;
        }
        state.p2pServer[prop] = value;
      });

      ipcRenderer.on(FROM_P2P.OUTBOUNDS_LIST_CHANGED, (event, data) => {
        console.log('FROM_P2P.OUTBOUNDS_LIST_CHANGED');
        state.p2pServer.outboundsList = data.outboundsList;
        commit('savePeers');
      });
      ipcRenderer.on(FROM_P2P.INBOUNDS_LIST_CHANGED, (event, data) => {
        console.log('FROM_P2P.INBOUNDS_LIST_CHANGED');
        state.p2pServer.inboundsList = data.inboundsList;
        commit('savePeers');
      });

      ipcRenderer.on(FROM_P2P.MINERS_LIST_CHANGED, (event, data) => {
        state.mining.miners = data.miners;
      });

      // restart MINING process if new transaction was created
      ipcRenderer.on(FROM_P2P.TRANSACTION_POOL_CHANGED, (event, { transactions }) => {
        console.log('FROM_P2P.TRANSACTION_POOL_CHANGED:');
        console.log(transactions);
        console.log('-'.repeat(10));

        state.transactionPool.transactions = transactions;
        commit('recalculateBalance');

        if (!state.miningIsUp) return;
        dispatch('startMining', { silenceMode: true });
      });

      // -------------------------------------------------------------------------------------------
      // Alerts
      // -------------------------------------------------------------------------------------------
      ipcRenderer.on(FROM_APP.ALERT, (event, data) => {
        dispatch('showAlert', data);
        if (data.type === 'error') dispatch('closeServer');
      });
      // -------------------------------------------------------------------------------------------
      // MINING
      // -------------------------------------------------------------------------------------------
      ipcRenderer.on(
        FROM_MINING.BLOCK_HAS_CALCULATED,
        (event, { chain, block }) => dispatch('onBlockCalculated', { chain, block }),
      );
      ipcRenderer.on(FROM_MINING.ERROR, (event, { error }) => dispatch('onMiningError', error));

      ipcRenderer.on(FROM_MINING.HASH_RATE, (event, hashRate) => {
        state.mining.hashRate = hashRate;
      });

      // -------------------------------------------------------------------------------------------
      // Wallet
      // -------------------------------------------------------------------------------------------
      ipcRenderer.on(FROM_BG.SIGN_IN_WALLET, (event, keyPair) => {
        // if keepLoggedIn was turned on
        dispatch('signInWallet', {
          ...keyPair,
          silentMode: true,
        });
      });

      ipcRenderer.on(FROM_BG.NEW_WALLET_SAVED, (event, filePath) => {
        commit('showAlert', {
          type: 'success',
          title: 'Success',
          message: `You have saved your keyPair at ${filePath} successfully.`,
        });
      });

      ipcRenderer.on(FROM_BG.NEW_WALLET_SAVE_ERROR, () => {
        commit('showAlert', {
          type: 'error',
          title: 'Error',
          message: 'An Error occurred during saving...',
        });
      });
    },
    initStore({ dispatch }) {
      dispatch('initBackgroundListeners');
      ipcRenderer.send(TO_BG.CHECK_PEERS_SAVING);
      ipcRenderer.send(TO_BG.CHECK_ALERTS_SAVING);
      ipcRenderer.send(TO_BG.CHECK_APP_UPDATES);
    },
    onBlockCalculated({ state, commit }, { block, chain }) {
      if (!state.blockchain) return;
      console.log('new Block calculated:', block);

      commit('sendToP2P', {
        channel: TO_P2P.NEW_BLOCK_ADDED,
        data: { block, chain },
      });
    },
    onMiningError({ dispatch }, error) {
      console.log(error);
      dispatch('showAlert', {
        type: 'error',
        title: 'Error',
        message: 'Something went wrong with mining...',
      });
      dispatch('stopMining');
    },
    async createServer({
      state,
      dispatch,
    }, options) {
      if (state.serverIsUp) dispatch('closeServer');

      let {
        serverPort,
      } = options;
      const {
        serverHost,
        ngrokAuthToken,
        ngrok,
        peers: peersString,
      } = options;

      // find free port if it doesn't set manually
      if (!serverPort) {
        try {
          serverPort = await portfinder.getPortPromise();
        } catch (err) {
          console.log(err);
          dispatch('showAlert', {
            type: 'error',
            title: 'Error',
            message: 'Application can`t detect free ports.',
          });
          return;
        }
      }

      // parse peers string
      let peers;
      if (peersString) {
        peers = peersString.trim()
          .replace(/[,\s;]+/gi, ',')
          .split(',');
      } else {
        peers = [];
      }
      peers = peers.concat(state.p2pServer.savedPeers);
      console.log(peers);

      state.transactionPool = new TransactionPool();
      state.blockchain = new Blockchain();

      // create p2p-server
      ipcRenderer.send(TO_BG.START_P2P_SERVER, {
        peers,
        host: serverHost,
        port: serverPort,
        ngrokAuthToken: ngrok ? ngrokAuthToken : null,
      });
    },
    createTransaction({ state, commit, dispatch }, transactionInfo) {
      if (state.transactionPending) return;

      state.transactionPending = true;

      const {
        recipient,
        amount,
        fee,
      } = transactionInfo;
      const transactionObj = state.wallet.createTransaction(
        recipient,
        amount,
        state.blockchain,
        state.transactionPool,
        fee,
      );

      if (transactionObj.transaction === null) {
        dispatch('showAlert', {
          type: 'error',
          title: 'Error',
          message: transactionObj.msg,
        });
      } else {
        dispatch('showAlert', {
          type: 'success',
          title: 'Success',
          message: 'Transaction has been created successfully!',
        });

        commit('sendToP2P', {
          channel: TO_P2P.NEW_TRANSACTION_CREATED,
          data: { transaction: transactionObj.transaction },
        });
      }
      state.transactionPending = false;

      if (!state.miningIsUp) return;
      dispatch('startMining', { silenceMode: true });
    },
    closeAlert({ state, dispatch }) {
      clearInterval(state.alertTimer);
      state.alertTimer = null;

      if (state.alertQueue.length > 0) {
        dispatch('showAlert');
      } else {
        state.alertIsShowing = false;
      }
    },
    signInWallet({
      state,
      dispatch,
    }, {
      privKey,
      pubKey,
      silentMode = false,
    }) {
      const isValid = ChainUtil.verifyKeyPair(privKey, pubKey);

      if (!isValid) {
        if (silentMode) return;
        dispatch('showAlert', {
          type: 'error',
          title: 'Error',
          message: 'Invalid key pair.',
        });
        return;
      }
      state.wallet = new Wallet(privKey);

      if (silentMode) return;

      dispatch('showAlert', {
        type: 'success',
        title: 'Success',
        message: 'You have been authorized successfully.',
      });
    },
    startMining({ state, dispatch, commit }, { silenceMode } = { silenceMode: false }) {
      if (!state.miningIsUp) {
        commit('setMiningStartTime');
        state.miningIsUp = true;
      }

      const pickedTransactions = state.transactionPool.pickTransactions(state.mining.feeThreshold);
      const rewardTransaction = Transaction.rewardTransaction(
        state.wallet,
        pickedTransactions,
        state.blockchain,
      );
      pickedTransactions.push(rewardTransaction);
      state.mining.rewardTransaction = rewardTransaction;

      ipcRenderer.send(TO_BG.START_MINING, JSON.stringify({
        pickedTransactions,
        blockchain: state.blockchain,
      }));

      commit('sendToP2P', {
        channel: TO_P2P.MINING_STARTED,
      });

      if (silenceMode) return;
      dispatch('showAlert', {
        type: 'info',
        title: 'Info',
        message: 'Mining process was started!',
      });
    },
    stopMining({ state, dispatch, commit }, { silenceMode } = { silenceMode: false }) {
      state.miningIsUp = false;

      ipcRenderer.send(TO_BG.STOP_MINING);

      commit('sendToP2P', {
        channel: TO_P2P.MINING_STOPPED,
      });

      if (silenceMode) return;
      dispatch('showAlert', {
        type: 'info',
        title: 'Info',
        message: 'Mining have been stopped.',
      });
    },
    closeServer({ state, commit, dispatch }) {
      ipcRenderer.send(TO_BG.STOP_P2P_SERVER);

      dispatch('routeHome');

      state.serverIsUp = false;
      state.p2pServer.outboundsList = [];
      state.p2pServer.inboundsList = [];
      state.p2pServer.externalDomain = null;

      commit('logOutWallet');

      if (!state.miningIsUp) return;
      dispatch('stopMining');
    },
    async routeHome() {
      await routeTo({ name: 'p2p' });
    },
  },
  modules: {},
});
