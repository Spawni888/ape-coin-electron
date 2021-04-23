import { createRouter, createWebHistory } from 'vue-router';
import Wallet from '@/views/Wallet';
import PeerToPeer from '@/views/PeerToPeer';
import Mining from '@/views/Mining';
import store from '@/store';
import Blockchain from '@/views/Blockchain';
import AlertsJournal from '@/views/AlertsJournal';

const routes = [
  {
    path: '/',
    name: 'p2p',
    component: PeerToPeer,
  },
  {
    path: '/blockchain',
    name: 'blockchain',
    component: Blockchain,
  },
  {
    path: '/wallet',
    name: 'wallet',
    component: Wallet,
  },
  {
    path: '/mining',
    name: 'mining',
    component: Mining,
  },
  {
    path: '/alerts-journal',
    name: 'alertJournal',
    component: AlertsJournal,
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
