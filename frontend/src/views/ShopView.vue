<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';

const q = ref('');
const loading = ref(false);
const error = ref('');
const products = ref([]);
const debug = ref(false);

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

async function load() {
  loading.value = true; error.value = '';
  try {
    // 1) Pour écarter un filtre qui exclurait tout, on enlève active=true pour le test.
    const { data } = await api.get('/api/products', { params: { q: q.value || undefined }});
    console.log('[Shop] /api/products →', data);
    products.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('[Shop] error', e);
    error.value = e?.response?.data?.error || e.message;
  } finally {
    loading.value = false;
  }
}

function imgUrl(p) {
  // si l’API renvoie "/uploads/....", on fabrique une URL absolue robuste
  const u = p?.images?.[0]?.url;
  if (!u) return '';
  try {
    return new URL(u, API_BASE).href; // gère /uploads/... comme http://localhost:4000/uploads/...
  } catch {
    return `${API_BASE}${u}`;
  }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <h1>Boutique</h1>
    <div class="bar">
      <input v-model="q" placeholder="Rechercher…" @keyup.enter="load" />
      <button @click="load">Charger</button>
      <label class="debug"><input type="checkbox" v-model="debug" /> Debug</label>
    </div>

    <p v-if="loading">Chargement…</p>
    <p v-if="error" class="err">Erreur: {{ error }}</p>
    <p v-if="!loading && !error">Produits trouvés : <strong>{{ products.length }}</strong></p>

    <pre v-if="debug" class="dbg">{{ products }}</pre>

    <div class="grid">
      <div v-for="p in products" :key="p.id" class="card">
        <img v-if="imgUrl(p)" :src="imgUrl(p)" :alt="p.images?.[0]?.alt || p.title" />
        <h3>{{ p.title }}</h3>
        <p v-if="p.description">{{ p.description }}</p>
        <strong>
          {{
            ((Number(p.priceHT) || 0) * (1 + (Number(p.tva) || 0)/100)).toFixed(2)
          }} €
        </strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { max-width: 900px; margin: 2rem auto; padding: 1rem; }
.bar { display:flex; gap:.5rem; margin-bottom:1rem; align-items:center; }
.debug { font-size: .9rem; opacity: .8; }
.grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap:1rem; }
.card { border:1px solid #eee; border-radius:10px; padding:1rem; }
.card img { width:100%; height:140px; object-fit:cover; border-radius:8px; background:#f6f6f6; }
.err { color:#b00020; }
.dbg { background:#111; color:#0f0; padding:8px; overflow:auto; max-height:260px; }
</style>
