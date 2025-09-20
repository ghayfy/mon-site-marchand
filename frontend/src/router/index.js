import { createRouter, createWebHistory } from 'vue-router';
import ShopView from '../views/ShopView.vue';
import AdminView from '../views/AdminView.vue';
import LoginView from '../views/LoginView.vue';
import CartView from '../views/CartView.vue';
import CheckoutView from '../views/CheckoutView.vue';
import AdminOrdersView from '../views/AdminOrdersView.vue';
import AddressesView from '../views/AddressesView.vue';
import PayPalReturnView from '../views/PayPalReturnView.vue';
import RegisterView from '../views/RegisterView.vue';

const routes = [
  { path: '/', component: ShopView },
  { path: '/login', component: LoginView },
  { path: '/admin', component: AdminView },
  { path: '/cart', component: CartView },
  { path: '/checkout', component: CheckoutView },
  { path: '/admin/orders', component: AdminOrdersView },
  { path: '/addresses', component: AddressesView },
  { path: '/success', component: PayPalReturnView },
  { path: '/cancel', component: PayPalReturnView },
  { path: '/register', component: RegisterView }, // Ajout
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
