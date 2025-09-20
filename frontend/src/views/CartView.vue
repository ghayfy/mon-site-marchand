<template>
  <div>
    <h2>Mon Panier</h2>
    <div v-if="items.length === 0">Votre panier est vide.</div>
    <table v-else border="1" cellpadding="6">
      <thead><tr><th>Produit</th><th>PU</th><th>Qté</th><th>Total</th><th></th></tr></thead>
      <tbody>
        <tr v-for="it in items" :key="it.id">
          <td>{{ productName(it.productId) }}</td>
          <td>{{ it.unitPrice }} €</td>
          <td><input type="number" min="1" v-model.number="it.quantity" @change="update(it)" style="width:60px" /></td>
          <td>{{ (it.quantity * it.unitPrice).toFixed(2) }} €</td>
          <td><button @click="remove(it.productId)">Supprimer</button></td>
        </tr>
      </tbody>
      <tfoot>
        <tr><td colspan="3" align="right">Sous-total</td><td>{{ totals.subtotal.toFixed(2) }} €</td><td></td></tr>
        <tr><td colspan="3" align="right">Frais de port</td><td>{{ totals.shipping.toFixed(2) }} €</td><td></td></tr>
        <tr><td colspan="3" align="right"><b>Total</b></td><td><b>{{ totals.total.toFixed(2) }} €</b></td><td></td></tr>
      </tfoot>
    </table>
    <div style="margin-top:12px">
      <router-link to="/checkout" v-if="items.length">Passer au paiement</router-link>
    </div>
  </div>
</template>
<script setup>
import { onMounted, computed, ref } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api' });
const store = useStore();
const items = computed(() => store.state.cart.items);
const products = computed(() => store.state.catalog.products);
const totals = ref({ subtotal:0, shipping:0, total:0 });
function productName(pid){ return products.value.find(p => p.id === pid)?.name || `#${pid}`; }
function update(it){ store.dispatch('cart/update', { productId: it.productId, quantity: it.quantity }); }
function remove(pid){ store.dispatch('cart/remove', pid); }
onMounted(async () => {
  await store.dispatch('catalog/load');
  await store.dispatch('cart/load');
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { data } = await api.get('/checkout/quote', { headers });
  totals.value = data;
});
</script>
