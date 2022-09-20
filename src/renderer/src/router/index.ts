import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
// 配置路由信息
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/main',
  },
  {
    name: 'main',
    path: '/main',
    component: () => import('@renderer/views/main/MainPage.vue'),
  },
]

const router = createRouter({
  routes,
  history: createWebHashHistory(),
})

export default router
