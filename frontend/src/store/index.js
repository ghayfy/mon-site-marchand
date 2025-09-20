import { createStore } from 'vuex';
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api' });

const auth = {
  namespaced: true,
  state: () => ({ token: localStorage.getItem('token') || null, user: null }),
  mutations: {
    setAuth(state, { token, user }) { state.token = token; state.user = user; },
    clear(state) { state.token = null; state.user = null; }
  },
  actions: {
    async login({ commit }, { email, password }) {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
      commit('setAuth', data);
    },
    logout({ commit }) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common.Authorization;
      commit('clear');
    }
  }
};

const catalog = {
  namespaced: true,
  state: () => ({ products: [], categories: [], promos: [] }),
  actions: {
    async load({ state }) {
      const [p, c, pr] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/promos')
      ]);
      state.products = p.data; state.categories = c.data; state.promos = pr.data;
    },
    async saveProduct(_, payload) {
      const { id, ...rest } = payload;
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      if (id) return (await api.put(`/products/${id}`, rest, { headers })).data;
      return (await api.post('/products', rest, { headers })).data;
    },
    async deleteProduct(_, id) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.delete(`/products/${id}`, { headers });
    }
  }
};

const cart = {
  namespaced: true,
  state: () => ({ items: [] }),
  actions: {
    async load({ state }) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await api.get('/cart', { headers });
      state.items = data.items || [];
    },
    async add({ dispatch }, payload) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.post('/cart/items', payload, { headers });
      await dispatch('load');
    },
    async update({ dispatch }, { productId, quantity }) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.put(`/cart/items/${productId}`, { quantity }, { headers });
      await dispatch('load');
    },
    async remove({ dispatch }, productId) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.delete(`/cart/items/${productId}`, { headers });
      await dispatch('load');
    }
  }
};

const orders = {
  namespaced: true,
  state: () => ({ list: [] }),
  actions: {
    async listAll({ state }) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await api.get('/checkout/orders', { headers });
      state.list = data;
    },
    async updateStatus(_, { id, status }) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.put(`/checkout/orders/${id}/status`, { status }, { headers });
    },
    async downloadPdf(_, id) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const url = `${api.defaults.baseURL}/checkout/orders/${id}/pdf`;
      const res = await fetch(url, { headers });
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `order-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }
};

const addresses = {
  namespaced: true,
  state: () => ({ items: [] }),
  actions: {
    async list({ state }) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await api.get('/addresses', { headers });
      state.items = data;
    },
    async create({ dispatch }, payload) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.post('/addresses', payload, { headers });
      await dispatch('list');
    },
    async update({ dispatch }, { id, ...rest }) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.put(`/addresses/${id}`, rest, { headers });
      await dispatch('list');
    },
    async remove({ dispatch }, id) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.delete(`/addresses/${id}`, { headers });
      await dispatch('list');
    },
    async setDefault({ dispatch }, id) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.post(`/addresses/${id}/default`, {}, { headers });
      await dispatch('list');
    }
  }
};

export default createStore({ modules: { auth, catalog, cart, orders, addresses } });
