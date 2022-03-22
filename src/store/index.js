import { createStore } from 'vuex';
import Blockchain from '@/resources/core/blockchain';
import TransactionPool from '@/resources/core/wallet/transactionPool';
import Wallet from '@/resources/core/wallet';
import Miner from '@/resources/core/app/miner';
import Block from '@/resources/core/blockchain/block';
import ChainUtil from '@/resources/core/chain-util';
import portfinder from 'portfinder';
import { ipcRenderer } from 'electron';
import { BLOCKCHAIN_WALLET } from '@/resources/core/config';
import {
  TO_BG,
  FROM_P2P,
  FROM_BG,
  FROM_APP,
} from '@/resources/events';
import uuid from 'uuid';
import { routeTo } from '@/router';

export default createStore({
  state: {
    server: null,
    p2pServer: {
      inbounds: {},
      inboundsList: [],
      outboundsList: [],
      outbounds: {},
      outboundsQuantity: 0,
      inboundsQuantity: 0,
      server: null,
      host: null,
      port: null,
      externalAddress: null,
      externalPort: null,
      ngrokAddress: null,
      peers: [],
    },
    blockchain: null,
    transactionPool: null,
    wallet: null,
    miner: null,
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
      return state.p2pServer.inboundsQuantity;
    },
    p2pOutboundsQuantity(state) {
      return state.p2pServer.outboundsQuantity;
    },
    p2pInboundsList(state) {
      return state.p2pServer.inboundsList;
    },
    p2pOutboundsList(state) {
      return state.p2pServer.outboundsList;
    },
    myPeerLink(state) {
      const { p2pServer } = state;
      if (p2pServer.externalAddress === null) return null;

      return `http://${p2pServer.externalAddress}:${p2pServer.externalPort}`;
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
    miningIsUp(state) {
      return state.miningIsUp;
    },
    blockchain(state) {
      return state.blockchain.chain;
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
      state.wallet.balance = state.wallet.calculateBalance(state.blockchain);
      state.wallet.calculateBalanceWithTpIncluded(state.transactionPool);
    },
  },
  actions: {
    async createServer({
      state,
      commit,
      dispatch,
    }, options) {
      dispatch('closeServer');

      let {
        serverPort,
        peers,
      } = options;
      const {
        serverHost,
        ngrokAuthToken,
        API,
        ngrok,
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
      if (peers) {
        peers = peers.trim()
          .replace(/[,\s;]+/gi, ',')
          .split(',');
      } else {
        peers = [];
      }

      // create HTTP Api, if active
      // if (API) {
      //   const app = new Koa();
      //   app.keys = ['--> stop looking here <--'];
      //   app
      //     .use(bodyParser());
      // eslint-disable-next-line max-len
      //   state.server = app.listen(serverPort, '127.0.0.1', () => console.log(`API running on port ${serverPort}`));
      // }

      state.transactionPool = new TransactionPool();
      state.blockchain = new Blockchain();

      // create p2p-server
      ipcRenderer.send(TO_BG.START_P2P_SERVER, {
        peers,
        host: serverHost,
        port: serverPort,
        httpServer: API ? state.server : null,
        ngrokAuthToken: ngrok ? ngrokAuthToken : null,
      });

      ipcRenderer.on(FROM_P2P.SERVER_STARTED, () => {
        state.serverIsUp = true;
        console.log(`Listening for peer-to-peer connections on: ${serverPort}`);
      });

      ipcRenderer.on(FROM_P2P.SERVER_STOPPED, () => {
        console.log(1111);
        dispatch('closeServer');
        console.log('Server stopped.');
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
        state.p2pServer.outboundsList = data.outboundsList;
      });
      ipcRenderer.on(FROM_P2P.INBOUNDS_LIST_CHANGED, (event, data) => {
        state.p2pServer.inboundsList = data.inboundsList;
      });

      // console logs
      ipcRenderer.on(FROM_BG.CONSOLE_LOG, (event, data) => {
        console.log(JSON.stringify(data));
      });

      // if keepLoggedIn was turned on
      ipcRenderer.send(TO_BG.CHECK_AUTH_SAVING);
      ipcRenderer.on(FROM_BG.SIGN_IN_WALLET, (event, keyPair) => {
        dispatch('signInWallet', {
          ...keyPair,
          silentMode: true,
        });
      });
    },
    createTransaction({ state, commit }, transactionInfo) {
      if (state.transactionPending) return;

      state.transactionPending = true;

      const {
        recipient,
        amount,
        fee,
      } = transactionInfo;
      const transaction = state.wallet.createTransaction(
        recipient,
        amount,
        state.blockchain,
        state.transactionPool,
        fee,
      );

      if (transaction.res === null) {
        commit('showAlert', {
          type: 'error',
          title: 'Error',
          message: transaction.msg,
        });
      } else {
        commit('showAlert', {
          type: 'success',
          title: 'Success',
          message: 'Transaction has been created successfully!',
        });
      }
      state.transactionPending = false;
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
        if (!silentMode) {
          commit('showAlert', {
            type: 'error',
            title: 'Error',
            message: 'Invalid key pair.',
          });
        }
        return;
      }
      state.wallet = new Wallet(privKey);

      state.miner = new Miner(
        state.blockchain,
        state.transactionPool,
        state.wallet,
      );
      state.miner.on('newBlock', (block) => {
        console.log('new Block:', block);
        state.blockchain.chain.push(new Block(...Object.values(block)));
        state.transactionPool.clear();

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
      });
      ipcRenderer.on('mining-error', (event, { error }) => {
        console.log(error);
        state.miningIsUp = false;
        commit('showAlert', {
          type: 'error',
          title: 'Error',
          message: 'Something went wrong...',
        });
      });

      state.transactionPool.on('clear', () => {
        commit('recalculateBalance');
      });

      if (!silentMode) {
        commit('showAlert', {
          type: 'success',
          title: 'Success',
          message: 'You have been authorized successfully.',
        });
      }
    },
    startMining({ state, dispatch }) {
      state.miningIsUp = true;

      state.miner.mine();

      ipcRenderer.on(FROM_P2P.TRANSACTION_POOL_CHANGED, (event, { transactions }) => {
        state.transactionPool.transactions = transactions;
        dispatch('stopMining', true);
        dispatch('startMining');
      });

      state.transactionPool.on('changed', () => {
        dispatch('stopMining');
      });
    },
    stopMining({ state, commit }, silence = false) {
      state.miningIsUp = false;
      state.miner.stopMining();

      if (silence) return;
      commit('showAlert', {
        type: 'info',
        title: 'Info',
        message: 'Mining have been stopped.',
      });
    },
    async routeHome() {
      console.log(10);
      await routeTo({ name: 'p2p' });
    },
    closeServer({ state, commit, dispatch }) {
      ipcRenderer.send(TO_BG.STOP_P2P_SERVER);

      ipcRenderer.removeAllListeners(FROM_BG.SIGN_IN_WALLET);
      ipcRenderer.removeAllListeners(FROM_P2P.SERVER_STARTED);
      ipcRenderer.removeAllListeners(FROM_P2P.ALERT);
      ipcRenderer.removeAllListeners(FROM_P2P.PROPERTY_CHANGED);
      ipcRenderer.removeAllListeners(FROM_P2P.OUTBOUNDS_LIST_CHANGED);
      ipcRenderer.removeAllListeners(FROM_P2P.INBOUNDS_LIST_CHANGED);

      state.transactionPool = null;
      state.blockchain = null;

      state.serverIsUp = false;

      commit('logOutWallet');
      dispatch('routeHome');

      if (!state.miningIsUp) return;
      dispatch('stopMining');
    },
  },
  modules: {},
});
