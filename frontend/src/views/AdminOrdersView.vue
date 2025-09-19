<template>
  <div class="wrap">
    <div class="toolbar" style="justify-content:flex-end"><button @click="clearAuth(); location.reload()">Déconnexion admin</button></div>
    <h2>Commandes</h2>

    <form class="toolbar" @submit.prevent="reload()">
      <label>
        Statut :
        <select v-model="filters.status">
          <option value="">(tous)</option>
          <option>NEW</option>
          <option>PAID</option>
          <option>SHIPPED</option>
          <option>CANCELLED</option>
        </select>
      </label>
      <label>
        Par page :
        <select v-model.number="limit">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
        </select>
      </label>
      <button type="submit">Appliquer</button>
      <span class="spacer"></span>
      <button type="button" @click="exportFile('csv')">Export CSV</button>
      <button type="button" @click="exportFile('pdf')">Export PDF</button>
    </form>

    <p v-if="loading">Chargement…</p>
    <p v-if="error" class="err">{{ error }}</p>

    <table v-if="items.length" class="tbl">
      <thead>
        <tr>
          <th>ID</th>
          <th>Date</th>
          <th>Client</th>
          <th>Total</th>
          <th>Statut</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="o in items" :key="o.id">
          <td>{{ o.id }}</td>
          <td>{{ formatDate(o.created_at) }}</td>
          <td>{{ (o.customer && (o.customer.name || o.customer.email)) || '-' }}</td>
          <td class="num">{{ money(o.total) }}</td>
          <td>
            <select v-model="o.status">
              <option>NEW</option>
              <option>PAID</option>
              <option>SHIPPED</option>
              <option>CANCELLED</option>
            </select>
          </td>
          <td>
            <button @click="saveStatus(o)" :disabled="savingId===o.id">Enregistrer</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading && !error">Aucune commande.</p>

    <div class="pager" v-if="total > 0">
      <button :disabled="page<=1" @click="page--; reload()">← Préc.</button>
      <span>Page {{ page }} / {{ totalPages }}</span>
      <button :disabled="page>=totalPages" @click="page++; reload()">Suiv. →</button>
    </div>
  </div>
</template>

<script setup>
import { clearAuth } from "@/lib/adminAuth.js"
import { ref, computed, onMounted } from 'vue'

const items = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const loading = ref(false)
const error = ref('')
const savingId = ref(null)
const filters = ref({ status: '' })

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

function money(n) {
  try { return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(Number(n||0)) }
  catch { return n }
}
function formatDate(iso) {
  if (!iso) return '-'
  try { return new Date(iso).toLocaleString('fr-FR') } catch { return iso }
}
async function reload() {
  loading.value = true; error.value = ''
  try {
    const qs = new URLSearchParams({
      page: String(page.value),
      limit: String(limit.value),
      ...(filters.value.status ? { status: filters.value.status } : {})
    }).toString()
    const r = await fetch(`/api/admin/orders?${qs}`)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const j = await r.json()
    items.value = j.items || []
    total.value = Number(j.total || 0)
  } catch (e) {
    error.value = 'Erreur chargement commandes: ' + (e.message || e)
  } finally {
    loading.value = false
  }
}
async function saveStatus(o) {
  savingId.value = o.id
  try {
    const r = await fetch(`/api/admin/orders/${o.id}/status`, {
      method:'PUT',
      headers:{ 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: o.status })
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    await reload()
  } catch (e) {
    alert('Échec MAJ statut: ' + (e.message || e))
  } finally {
    savingId.value = null
  }
}
async function exportFile(kind) {
  await ensureAuth();
  const _h = getAuthHeader();
  const qs = new URLSearchParams({ ...(filters.value.status ? { status: filters.value.status } : {}) }).toString()
  const url = `/api/admin/orders/export.${kind}${qs ? `?${qs}` : ""}`
  const r = await fetch(url, { headers: _h })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const blob = await r.blob()
  const href = URL.createObjectURL(blob)
  const a = document.createElement(a)
  a.href = href
  a.download = kind === csv ? orders.csv : orders.pdf
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(href)
}
onMounted(reload)
</script>

<style scoped>
.wrap { max-width: 1000px; margin: 1rem auto; }
.toolbar { display:flex; gap:.6rem; align-items:center; margin:.6rem 0; }
.toolbar .spacer { flex:1 }
.err { color:#c00 }
.tbl { width:100%; border-collapse: collapse; }
.tbl th, .tbl td { border:1px solid #eee; padding:.4rem; }
.tbl th { background:#fafafa; text-align:left; }
.num { text-align:right }
.pager { display:flex; gap:.6rem; align-items:center; justify-content:center; margin:.8rem 0; }
</style>
