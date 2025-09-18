<template>
  <div class="container" style="max-width:900px;margin:2rem auto;font-family:system-ui,-apple-system,Segoe UI,Roboto">
    <header style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
      <h1 style="margin:0">Mon Shop</h1>
      <div>
        🛒 <strong>{{ cartCount }}</strong>
        <button @click="clearCart" style="margin-left:1rem">Vider</button>
      </div>
    </header>
    <section>
      <h2 style="margin:0 0 1rem 0">Produits</h2>
      <div v-if="loading">Chargement…</div>
      <div v-else-if="error" style="color:#c00">{{ error }}</div>
      <ul v-else style="list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
        <li v-for="p in products" :key="p.id" style="border:1px solid #eee;border-radius:10px;padding:12px">
          <h3 style="margin:.2rem 0 0 0">{{ p.name }}</h3>
          <p style="margin:.4rem 0;color:#444">{{ formatPrice(p.price) }}</p>
          <button @click="addToCart(p)" style="width:100%">Ajouter</button>
        </li>
      </ul>
      <p v-if="!loading && !error && products.length===0" style="color:#666">Aucun produit.</p>
    </section>
    <footer style="margin-top:2rem;color:#777">API: <code>/api/products</code> via Nginx → backend</footer>
  </div>
</template>
<script setup>
import { onMounted, ref, computed } from 'vue'
const products = ref([])
const loading = ref(false)
const error = ref('')
const cart = ref([])
const CART_KEY = 'shop_cart_v1'
function loadCart() {
  try { cart.value = JSON.parse(localStorage.getItem(CART_KEY) || '[]') } catch { cart.value = [] }
}
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart.value))
}
function addToCart(p) {
  cart.value.push({ id: p.id, name: p.name, price: p.price, qty: 1 })
  saveCart()
}
function clearCart() {
  cart.value = []
  saveCart()
}
const cartCount = computed(() => cart.value.reduce((n, it) => n + (it.qty || 1), 0))
function formatPrice(n) {
  try { return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' }).format(Number(n)) } catch { return n }
}
async function fetchProducts() {
  loading.value = true
  error.value = ''
  try {
    const r = await fetch('/api/products?limit=20')
    if (!r.ok) throw new Error('HTTP '+r.status)
    const data = await r.json()
    products.value = data.items || []
  } catch (e) {
    error.value = 'Erreur chargement produits: ' + (e?.message || e)
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  loadCart()
  fetchProducts()
})
</script>
<style>
button { cursor:pointer;border:1px solid #ddd;border-radius:8px;padding:.5rem .8rem;background:#fafafa }
button:hover { background:#f0f0f0 }
</style>
