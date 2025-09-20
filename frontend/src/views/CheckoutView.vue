<template>
  <div>
    <h2>Paiement</h2>
    <div v-if="addrList.length">
      <label>Adresse de livraison</label>
      <select v-model="shippingId">
        <option v-for="a in addrList" :key="a.id" :value="a.id">{{ a.fullName }} — {{ a.line1 }}, {{ a.city }}</option>
      </select>
    </div>
    <p>Entrez votre carte pour finaliser la commande.</p>
    <div id="card-element" style="padding:12px;border:1px solid #ccc;border-radius:8px"></div>
    <button :disabled="loading" @click="pay" style="margin-top:12px">{{ loading ? 'Paiement...' : 'Payer' }}</button>
    <p v-if="error" style="color:red">{{ error }}</p>
    <p v-if="success" style="color:green">Paiement réussi ✅</p>
  </div>
</template>
<script setup>
import { onMounted, ref, computed } from 'vue';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import { useStore } from 'vuex';
const store = useStore();
const loading = ref(false); const error = ref(''); const success = ref(false);
let stripe, card;
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api' });
const addrList = computed(() => store.state.addresses.items.filter(a => a.type === 'shipping'));
const shippingId = ref(null);
onMounted(async () => {
  await store.dispatch('addresses/list');
  const def = store.state.addresses.items.find(a => a.isDefault && a.type === 'shipping') || store.state.addresses.items.find(a => a.type === 'shipping');
  shippingId.value = def?.id || null;
  const pub = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  stripe = await loadStripe(pub);
  const elements = stripe.elements();
  card = elements.create('card'); card.mount('#card-element');
});
async function pay(){
  loading.value = true; error.value = ''; success.value = false;
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const shippingAddress = store.state.addresses.items.find(a => a.id === shippingId.value) || null;
    const { data } = await api.post('/checkout/create-intent', { currency: 'eur', shippingAddress }, { headers });
    const { clientSecret } = data;
    const result = await stripe.confirmCardPayment(clientSecret, { payment_method: { card } });
    if (result.error) { error.value = result.error.message; }
    else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') { success.value = true; }
  } catch(e){ error.value = e?.response?.data?.error || e.message; }
  finally { loading.value = false; }
}
</script>
