import { createStore } from 'vuex';
import Blockchain from '@/resources/core/blockchain';
import TransactionPool from '@/resources/core/wallet/transactionPool';
import Wallet from '@/resources/core/wallet';
import Miner from '@/resources/core/app/miner';
import Block from '@/resources/core/blockchain/block';
import ChainUtil from '@/resources/core/chain-util';
import portfinder from 'portfinder';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { ipcRenderer } from 'electron';
import { BLOCKCHAIN_WALLET } from '@/resources/core/config';

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
    alertIsShowing: false,
    alertTimer: null,
    alertInfo: {
      type: 'error',
      title: 'Error',
      message: 'Try again later...',
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
        const sameAlertAlreadyExists = state.alertQueue.find(
          alert => (alert.message === alertInfo.message) && (alert.type === alertInfo.type),
        );
        if (sameAlertAlreadyExists !== undefined) return;

        state.alertQueue.push(alertInfo);
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
      console.log(state.wallet.balance);
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
        console.log(peers);
      } else {
        peers = [];
      }

      // create HTTP Api, if active
      if (API) {
        const app = new Koa();
        app.keys = ['--> stop looking here <--'];
        app
          .use(bodyParser());
        state.server = app.listen(serverPort, '127.0.0.1', () => console.log(`API running on port ${serverPort}`));
      }

      state.transactionPool = new TransactionPool();
      state.blockchain = new Blockchain();
      // create p2p-server
      ipcRenderer.send('start-p2p-server', {
        peers,
        host: serverHost,
        port: serverPort,
        httpServer: API ? state.server : null,
        ngrokAuthToken: ngrok ? ngrokAuthToken : null,
      });

      ipcRenderer.on('p2p-server-started', () => {
        state.serverIsUp = true;
        console.log(`Listening for peer-to-peer connections on: ${serverPort}`);
      });

      // alerts
      ipcRenderer.on('p2p-alert', (event, data) => {
        console.log(data.message);
        commit('showAlert', data);
        if (data.type === 'error') dispatch('closeServer');
      });

      // p2p-server property changes
      ipcRenderer.on('p2p-property-changed', (event, data) => {
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

      ipcRenderer.on('outbounds-list-changed', (event, data) => {
        console.log('outbounds', data);
        state.p2pServer.outboundsList = data.outboundsList;
      });
      ipcRenderer.on('inbounds-list-changed', (event, data) => {
        console.log('inbounds', data);
        state.p2pServer.inboundsList = data.inboundsList;
      });

      // if keepLoggedIn was turned on
      ipcRenderer.send('checkAuth');
      ipcRenderer.on('signInWallet', (event, keyPair) => {
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

      // TODO: remake its logic
      ipcRenderer.on('transaction-pool-changed', (event, { transactions }) => {
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
    closeServer({ state, commit, dispatch }) {
      ipcRenderer.send('stop-p2p-server');
      ipcRenderer.removeAllListeners('signInWallet');
      ipcRenderer.removeAllListeners('p2p-server-started');
      ipcRenderer.removeAllListeners('p2p-alert');
      ipcRenderer.removeAllListeners('p2p-property-changed');
      ipcRenderer.removeAllListeners('outbounds-list-changed');
      ipcRenderer.removeAllListeners('inbounds-list-changed');

      state.transactionPool = null;
      state.blockchain = null;
      state.miner = null;

      state.serverIsUp = false;

      commit('logOutWallet');

      if (!state.miningIsUp) return;
      dispatch('stopMining');
    },
  },
  modules: {},
});
