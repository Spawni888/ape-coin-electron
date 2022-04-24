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
    backgroundListenersInitialized: false,
    walletRelatedTransactions: [],
    p2pServer: {
      inboundsList: [],
      outboundsList: [],
      server: null,
      host: null,
      port: null,
      protocol: 'http',
      externalDomain: null,
      externalPort: null,
      externalAddress: null,
      ngrokHost: null,
      peers: [],
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
      return state.walletRelatedTransactions;
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
      return state.wallet.balanceWithTpIncluded;
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
  },
  mutations: {
    logOutWallet(state) {
      state.wallet = null;
    },
    showAlert(state, alertInfo = null) {
      if (alertInfo !== null) {
        alertInfo.timestamp = Date.now();
        alertInfo.id = uuid.v4();

        const sameAlertAlreadyExists = state.alertQueue.find(
          alert => (alert.message === alertInfo.message) && (alert.type === alertInfo.type),
        );
        if (sameAlertAlreadyExists !== undefined) return;

        state.alertQueue.push(alertInfo);
        state.alertsJournal.push(alertInfo);
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
      state.walletRelatedTransactions = Wallet.getNewWalletRelatedTransactions(pubKey, {
        bc: state.blockchain.chain,
        tp: state.transactionPool.transactions,
        bcStart,
        bcEnd,
      });
    },
  },
  actions: {
    initBackgroundListeners({ state, commit, dispatch }) {
      state.backgroundListenersInitialized = true;

      // console logs
      ipcRenderer.on(FROM_BG.CONSOLE_LOG, (event, data) => {
        console.log(JSON.stringify(data));
      });

      ipcRenderer.on(FROM_P2P.SERVER_STARTED, (event, { serverPort }) => {
        state.serverIsUp = true;
        console.log(`Listening for peer-to-peer connections on: ${serverPort}`);
      });

      ipcRenderer.on(FROM_P2P.SERVER_STOPPED, () => {
        commit('showAlert', {
          type: 'info',
          title: 'Info',
          message: 'Server Process exited!',
        });

        dispatch('closeServer');
      });

      ipcRenderer.on(FROM_P2P.BLOCKCHAIN_CHANGED, (event, { chain }) => {
        console.log('FROM_P2P.BLOCKCHAIN_CHANGED:');
        console.log(chain);
        console.log('-'.repeat(10));

        for (let i = state.blockchain.chain.length - 1; i >= 0; i--) {
          state.blockchain.chain.pop();
        }
        chain.forEach(block => {
          state.blockchain.chain.push(new Block(...Object.values(block)));
        });

        state.transactionPool.clear();
        commit('recalculateBalance');
        dispatch('updateWalletRelatedTransactions');

        if (!state.miningIsUp) return;
        dispatch('startMining', { silenceMode: true });
      });

      // alerts
      ipcRenderer.on(FROM_APP.ALERT, (event, data) => {
        console.log(data.message);
        commit('showAlert', data);
        if (data.type === 'error') dispatch('closeServer');
      });

      // p2p-server property changes
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
      });
      ipcRenderer.on(FROM_P2P.INBOUNDS_LIST_CHANGED, (event, data) => {
        console.log('FROM_P2P.INBOUNDS_LIST_CHANGED');
        state.p2pServer.inboundsList = data.inboundsList;
      });

      // FROM_MINING
      ipcRenderer.on(
        FROM_MINING.BLOCK_HAS_CALCULATED,
        (event, { chain, block }) => dispatch('onBlockCalculated', { chain, block }),
      );
      ipcRenderer.on(FROM_MINING.ERROR, (event, { error }) => dispatch('onMiningError', error));

      // restart MINING process if new transaction was created
      ipcRenderer.on(FROM_P2P.TRANSACTION_POOL_CHANGED, (event, { transactions }) => {
        console.log('FROM_P2P.TRANSACTION_POOL_CHANGED:');
        console.log(transactions);
        console.log('-'.repeat(10));

        state.transactionPool.transactions = transactions;
        dispatch('updateWalletRelatedTransactions');
        commit('recalculateBalance');

        if (!state.miningIsUp) return;
        dispatch('startMining', { silenceMode: true });
      });

      // if keepLoggedIn was turned on
      ipcRenderer.on(FROM_BG.SIGN_IN_WALLET, (event, keyPair) => {
        dispatch('signInWallet', {
          ...keyPair,
          silentMode: true,
        });
      });
    },
    onBlockCalculated({ state, dispatch, commit }, { block, chain }) {
      console.log('new Block calculated:', block);

      // TODO: MAKE ALERTION ABOUT NEW BLOCK AND ABOUT TRANSACTIONS
      for (let i = state.blockchain.chain.length - 1; i >= 0; i--) {
        state.blockchain.chain.pop();
      }
      // eslint-disable-next-line no-underscore-dangle
      for (const _block of chain) {
        state.blockchain.chain.push(_block);
      }

      state.transactionPool.clear();
      commit('recalculateBalance');
      dispatch('updateWalletRelatedTransactions');

      const reward = block.data
        .find(transaction => transaction.input.address === BLOCKCHAIN_WALLET)
        .outputs
        .find(output => output.address === state.wallet.publicKey)
        .amount;

      commit('showAlert', {
        type: 'success',
        title: 'Success',
        message: `You have mine block with difficulty: ${block.difficulty} and earn ${reward} coins!`,
      });

      commit('sendToP2P', {
        channel: TO_P2P.NEW_BLOCK_ADDED,
        data: { block, chain },
      });
      setTimeout(() => dispatch('startMining', { silenceMode: true }), 0);
    },
    onMiningError({ dispatch, commit }, error) {
      console.log(error);
      commit('showAlert', {
        type: 'error',
        title: 'Error',
        message: 'Something went wrong with mining...',
      });
      dispatch('stopMining');
    },
    async createServer({
      state,
      commit,
      dispatch,
    }, options) {
      if (!state.backgroundListenersInitialized) dispatch('initBackgroundListeners');
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

      // find free port if doesn't set manually
      if (!serverPort) {
        try {
          serverPort = await portfinder.getPortPromise();
        } catch (err) {
          console.log(err);
          commit('showAlert', {
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
      state.transactionPool = new TransactionPool();
      state.blockchain = new Blockchain();

      // create p2p-server
      ipcRenderer.send(TO_BG.START_P2P_SERVER, {
        peers,
        host: serverHost,
        port: serverPort,
        ngrokAuthToken: ngrok ? ngrokAuthToken : null,
      });

      // if keepLoggedIn was turned on the wallet will sign in
      ipcRenderer.send(TO_BG.CHECK_AUTH_SAVING);
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
        commit('showAlert', {
          type: 'error',
          title: 'Error',
          message: transactionObj.msg,
        });
      } else {
        commit('showAlert', {
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
    closeAlert({ state, commit }) {
      clearInterval(state.alertTimer);
      state.alertTimer = null;

      if (state.alertQueue.length > 0) {
        commit('showAlert');
      } else {
        state.alertIsShowing = false;
      }
    },
    signInWallet({
      state,
      commit,
    }, {
      privKey,
      pubKey,
      silentMode = false,
    }) {
      const isValid = ChainUtil.verifyKeyPair(privKey, pubKey);

      if (!isValid) {
        if (silentMode) return;
        commit('showAlert', {
          type: 'error',
          title: 'Error',
          message: 'Invalid key pair.',
        });
        return;
      }
      state.wallet = new Wallet(privKey);

      if (silentMode) return;

      commit('showAlert', {
        type: 'success',
        title: 'Success',
        message: 'You have been authorized successfully.',
      });
    },
    startMining({ state, commit }, { silenceMode } = { silenceMode: false }) {
      state.miningIsUp = true;

      const pickedTransactions = state.transactionPool.pickTransactions();
      const rewardTransaction = Transaction.rewardTransaction(
        state.wallet,
        pickedTransactions,
        state.blockchain,
      );
      pickedTransactions.push(rewardTransaction);

      ipcRenderer.send(TO_BG.START_MINING, JSON.stringify({
        pickedTransactions,
        blockchain: state.blockchain,
      }));

      // TODO: remove this line if app will work correctly without it:
      // state.transactionPool.on('changed', () => dispatch('stopMining'));

      if (silenceMode) return;
      commit('showAlert', {
        type: 'info',
        title: 'Info',
        message: 'Mining process was started!',
      });
    },
    stopMining({ state, commit }, { silenceMode } = { silenceMode: false }) {
      state.miningIsUp = false;

      ipcRenderer.send(TO_BG.STOP_MINING);

      if (silenceMode) return;
      commit('showAlert', {
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
    updateWalletRelatedTransactions({ state, commit }) {
      // TODO: unable it for a while. Remove it later maybe.
      return;
      // eslint-disable-next-line no-unreachable
      if (state.wallet === null) return;
      let availableAlertsCount = 3;

      const newWalletRelatedTransactions = Wallet.getNewWalletRelatedTransactions(
        state.wallet.publicKey,
        {
          oldRelatedTransactions: state.walletRelatedTransactions,
          bc: state.blockchain.chain,
          tp: state.transactionPool.transactions,
        },
      );
      newWalletRelatedTransactions.forEach(transaction => {
        state.walletRelatedTransactions.push(transaction);

        if (transaction.input.address === state.wallet.publicKey) return;
        if (transaction.input.address === Wallet.getBlockchainAddress()) return;

        // create alerts about new received tokens
        transaction.outputs.forEach(output => {
          if (output.address === state.wallet.publicKey && availableAlertsCount > 0) {
            commit('showAlert', {
              type: 'info',
              title: 'Info',
              message: `You received ${output.amount} tokens. View tab 'transactions' for more info.`,
            });
            availableAlertsCount -= 1;
          }
        });
      });
    },
  },
  modules: {},
});
