import { createStore } from 'vuex';
import P2pServer from '@/assets/core/app/p2p-server';
import Blockchain from '@/assets/core/blockchain';
import TransitionPool from '@/assets/core/wallet/transactionPool';
import portfinder from 'portfinder';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';

export default createStore({
  state: {
    server: null,
    p2pServer: null,
    blockchain: new Blockchain(),
    transitionPool: new TransitionPool(),
    alertIsShowing: false,
    alertTimer: null,
    serverIsUp: false,
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
  },
  mutations: {
    destroyServer(state) {
      state.server = null;
      state.p2pServer = null;
      state.serverIsUp = false;
      state.transitionPool.clear();
    },
    closeAlert(state) {
      state.alertIsShowing = false;
    },
    showAlert(state, alertInfo = null) {
      if (alertInfo !== null) {
        state.alertInfo = alertInfo;
      }
      if (state.alertTimer) {
        clearTimeout(state.alertTimer);
      }
      state.alertIsShowing = true;
      state.alertTimer = setTimeout(() => {
        state.alertIsShowing = false;
      }, 5000);
    },
  },
  actions: {
    async createServer({ state, commit }, options) {
      if (state.serverIsUp) {
        commit('destroyServer');
      }
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
      state.p2pServer = new P2pServer(state.blockchain, state.transitionPool);
      state.p2pServer.on('error', (err) => {
        console.log(err);
        commit('showAlert', {
          type: 'error',
          title: 'Error',
          message: err,
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
  },
  modules: {
  },
});
