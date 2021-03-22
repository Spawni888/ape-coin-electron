import { createStore } from 'vuex';
import P2pServer from '@/assets/core/app/p2p-server';
import Blockchain from '@/assets/core/blockchain';
import TransitionPool from '@/assets/core/wallet/transactionPool';

export default createStore({
  state: {
  },
  mutations: {
    createServer(state, options) {
      let {
        peers,
        serverHost,
        serverPort,
        ngrokApi,
        API,
        ngrok,
      } = options;

      if (peers) {
        peers = peers.trim().replace(/[,\s;]+/gi, ',').split(',');
        console.log(peers);
      }
    },
  },
  actions: {
  },
  modules: {
  },
});
