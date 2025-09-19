<template>
  <div class="wrap">
    <h2>Catalogue</h2>

    <form class="toolbar" @submit.prevent="reload()">
      <label>Par page :
        <select v-model.number="limit">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
        </select>
      </label>
      <button type="submit">Appliquer</button>
    </form>

    <p v-if="loading">Chargement…</p>
    <p v-if="error" class="err">{{ error }}</p>

    <table v-if="items.length" class="tbl">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nom</th>
          <th class="num">Prix</th>
          <th>Stock</th>
          <th>Actif</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in items" :key="p.id">
          <td>{{ p.id }}</td>
          <td>{{ p.name || p.title }}</td>
          <td class="num">{{ money(p.price || p.priceHT) }}</td>
          <td>{{ p.stock ?? '-' }}</td>
          <td>{{ p.active === false ? 'Non' : 'Oui' }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading && !error">Aucun produit.</p>

    <div class="pager" v-if="total > 0">
      <button :disabled="page<=1" @click="page--; reload()">← Préc.</button>
      <span>Page {{ page }} / {{ totalPages }}</span>
      <button :disabled="page>=totalPages" @click="page++; reload()">Suiv. →</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const items = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const loading = ref(false)
const error = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

function money(n) {
  const v = Number(n||0)
  try { return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(v) }
  catch { return v }
}
async function reload() {
  loading.value = true; error.value = ''
  try {
    const qs = new URLSearchParams({ page:String(page.value), limit:String(limit.value) }).toString()
    const r = await fetch(`/api/admin/products?${qs}`)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const j = await r.json()
    items.value = j.items || []
    total.value = Number(j.total || items.value.length)
  } catch (e) {
    error.value = 'Erreur chargement produits: ' + (e.message || e)
  } finally {
    loading.value = false
  }
}
onMounted(reload)
</script>

<style scoped>
.wrap { max-width: 1000px; margin: 1rem auto; }
.toolbar { display:flex; gap:.6rem; align-items:center; margin:.6rem 0; }
.err { color:#c00 }
.tbl { width:100%; border-collapse: collapse; }
.tbl th, .tbl td { border:1px solid #eee; padding:.4rem; }
.tbl th { background:#fafafa; text-align:left; }
.num { text-align:right }
.pager { display:flex; gap:.6rem; align-items:center; justify-content:center; margin:.8rem 0; }
</style>
