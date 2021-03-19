import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/Login.vue';
import Wallet from '@/views/Wallet';
import PeerToPeer from '@/views/PeerToPeer';

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

export default router;
