import { createRouter, createWebHashHistory } from 'vue-router'
import AdminOrdersView from './views/AdminOrdersView.vue'
import AdminProductsView from './views/AdminProductsView.vue'
const routes = [
  { path: '/admin/orders', component: AdminOrdersView },
  { path: '/admin/products', component: AdminProductsView },
]
export default createRouter({ history: createWebHashHistory(), routes })
