import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/Login.vue';
import Wallet from '@/views/Wallet';
import PeerToPeer from '@/views/PeerToPeer';
import store from '@/store';

const routes = [
  {
    path: '/',
    name: 'p2p',
    component: PeerToPeer,
  },
  {
    path: '/wallet',
    name: 'wallet',
    component: Wallet,
  },
  {
    path: '/mining',
    name: 'mining',
    component: Login,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.name === 'p2p') {
    return next();
  }
  if (!store.getters.serverIsUp) {
    return next('/');
  }
  return next();
});
export default router;
