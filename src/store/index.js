import { createStore } from 'vuex';
import P2pServer from '@/assets/core/app/p2p-server';
import Blockchain from '@/assets/core/blockchain';
import TransitionPool from '@/assets/core/wallet/transactionPool';
import Wallet from '@/assets/core/wallet';
import Miner from '@/assets/core/app/miner';
import ChainUtil from '@/assets/core/chain-util';
import portfinder from 'portfinder';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';

export default createStore({
  state: {
    server: null,
    p2pServer: null,
    p2pInbounds: null,
    blockchain: null,
    transitionPool: null,
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
      state.transitionPool = new TransitionPool();
      state.blockchain = new Blockchain();
      state.p2pServer = new P2pServer(state.blockchain, state.transitionPool);

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
        state.transitionPool,
        state.wallet,
        state.p2pServer,
      );

      if (!silentMode) {
        commit('showAlert', {
          type: 'success',
          title: 'Success',
          message: 'You have been authorized successfully.',
        });
      }
    },
    closeServer({ state, commit }) {
      state.server = null;
      state.p2pServer = null;
      state.transitionPool = null;
      state.serverIsUp = false;
      commit('logOutWallet');
    },
  },
  modules: {},
});
