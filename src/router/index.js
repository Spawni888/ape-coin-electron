import { createRouter, createWebHistory } from 'vue-router';
import Main from '@/views/Main.vue';
import Login from '@/views/Login.vue';
import Wallet from '@/views/Wallet';

const routes = [
  {
    path: '/',
    component: Main,
    children: [
      {
        path: '/p2p',
        name: 'p2p',
        component: Login,
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
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
