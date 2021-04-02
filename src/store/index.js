import { createStore } from 'vuex';
import P2pServer from '@/assets/core/app/p2p-server';
import Blockchain from '@/assets/core/blockchain';
import TransactionPool from '@/assets/core/wallet/transactionPool';
import Wallet from '@/assets/core/wallet';
import Miner from '@/assets/core/app/miner';
import ChainUtil from '@/assets/core/chain-util';
import portfinder from 'portfinder';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { ipcRenderer } from 'electron';
import { BLOCKCHAIN_WALLET } from '@/assets/core/config';

export default createStore({
  state: {
    server: null,
    p2pServer: null,
    p2pInbounds: null,
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
    p2pInbounds(state) {
      return state.p2pServer.inboundsQuantity;
    },
    p2pOutbounds(state) {
      return state.p2pServer.outboundsQuantity;
    },
    myPeerLink(state) {
      return state.p2pServer.myPeerLink;
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
    transactionPending(state) {
      return state.transactionPending;
    },
    miningIsUp(state) {
      return state.miningIsUp;
    },
  },
  mutations: {
    logOutWallet(state) {
      state.miner = null;
      state.wallet = null;
    },
    showAlert(state, alertInfo = null) {
      if (alertInfo !== null) {
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
      state.wallet.calculateBalanceWithTpIncluded(state.transactionPool);
    },
  },
  actions: {
    async createServer({
      state,
      commit,
      dispatch,
    }, options) {
      // TODO: uncomment it

      // if (state.serverIsUp) {
      //   dispatch('closeServer');
      // }
      let {
        serverPort,
        peers,
      } = options;
      const {
        serverHost,
        ngrokApiKey,
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

      // create p2p-server
      state.transactionPool = new TransactionPool();
      state.blockchain = new Blockchain();
      state.p2pServer = new P2pServer(state.blockchain, state.transactionPool);

      state.p2pServer.on('error', (err) => {
        console.log(err);
        commit('showAlert', {
          type: 'error',
          title: 'Error',
          message: err,
        });
        dispatch('closeServer');
      });
      state.p2pServer.on('success', (msg) => {
        console.log(msg);
        commit('showAlert', {
          type: 'success',
          title: 'Success',
          message: msg,
        });
      });
      state.p2pServer.on('info', (msg) => {
        console.log(msg);
        commit('showAlert', {
          type: 'info',
          title: 'Info',
          message: msg,
        });
      });

      state.p2pServer.listen({
        peers,
        host: serverHost,
        port: serverPort,
        httpServer: API ? state.server : null,
        ngrokApiKey: ngrok ? ngrokApiKey : null,
      }, () => {
        state.serverIsUp = true;
        console.log(`Listening for peer-to-peer connections on: ${serverPort}`);
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
        state.p2pServer,
      );
      state.transactionPool.on('clear', () => commit('recalculateBalance'));

      if (!silentMode) {
        commit('showAlert', {
          type: 'success',
          title: 'Success',
          message: 'You have been authorized successfully.',
        });
      }
    },
    async startMining({ state, commit }) {
      state.miningIsUp = true;

      try {
        while (state.miningIsUp) {
          // eslint-disable-next-line no-await-in-loop
          const block = await state.miner.mine();

          if (block !== null) {
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
          }
        }
      } catch (e) {
        console.log(e);
        state.miningIsUp = false;

        commit('showAlert', {
          type: 'error',
          title: 'Error',
          message: 'Something went wrong...',
        });
      }
    },
    stopMining({ state, commit }) {
      state.blockchain.emit('stop-mining');
      state.miningIsUp = false;
      commit('showAlert', {
        type: 'info',
        title: 'Info',
        message: 'Mining have been stopped.',
      });
    },
    closeServer({ state, commit, dispatch }) {
      state.server = null;
      state.p2pServer = null;
      state.transactionPool = null;
      state.serverIsUp = false;
      commit('logOutWallet');
      dispatch('stopMining');
    },
  },
  modules: {},
});
