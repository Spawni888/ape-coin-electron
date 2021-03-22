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
    blockchain: null,
    transitionPool: null,
  },
  mutations: {

  },
  actions: {
    async createServer(state, options) {
      let {
        serverPort,
        serverHost,
        ngrokApiKey,
        peers,
        API,
        ngrok,
      } = options;

      if (!serverPort) {
        try {
          serverPort = await portfinder.getPortPromise();
        } catch (e) {
          console.log(e);
          return;
        }
      }

      if (peers) {
        peers = peers.trim()
          .replace(/[,\s;]+/gi, ',')
          .split(',');
        console.log(peers);
      } else {
        peers = [];
      }

      if (API) {
        const app = new Koa();
        app.keys = ['--> stop looking here <--'];
        app
          .use(bodyParser());
        state.server = app.listen(serverPort, '127.0.0.1', () => console.log(`API running on port ${serverPort}`));
      }
      state.blockchain = new Blockchain();
      state.transitionPool = new TransitionPool();
      state.p2pServer = new P2pServer(state.blockchain, state.transitionPool);
      state.p2pServer.on('error', (err) => {
        console.log(err);
      });
      state.p2pServer.listen({
        peers,
        host: serverHost,
        port: serverPort,
        httpServer: API ? state.server : null,
        ngrokApiKey: ngrok ? ngrokApiKey : null,
      }, () => console.log(`Listening for peer-to-peer connections on: ${serverPort}`));
    },
  },
  modules: {
  },
});
