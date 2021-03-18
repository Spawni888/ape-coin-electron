import { createRouter, createWebHistory } from 'vue-router';
import Main from '@/views/Main.vue';
import Login from '@/views/Login.vue';

const routes = [
  {
    path: '/',
    component: Main,
    children: [
      {
        path: '',
        name: 'login',
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
