<template>
  <div style="max-width:1100px;margin:2rem auto;font-family:system-ui,-apple-system,Segoe UI,Roboto">
    <h2>Admin – Commandes</h2>
    <form @submit.prevent="load" style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:end;margin:.8rem 0">
      <label>Statut
        <select v-model="status">
          <option value="">(tous)</option>
          <option>PAID</option>
          <option>SHIPPED</option>
          <option>CANCELLED</option>
        </select>
      </label>
      <label>Du <input type="date" v-model="from"/></label>
      <label>Au <input type="date" v-model="to"/></label>
      <label>Page <input type="number" min="1" v-model.number="page" style="width:80px"/></label>
      <label>Limit <input type="number" min="1" v-model.number="limit" style="width:80px"/></label>
      <button type="submit">Filtrer</button>
      <button type="button" @click="exportCsv">Export CSV</button>
      <button type="button" @click="exportPdf">Export PDF</button>
    </form>
    <div v-if="loading">Chargement…</div>
    <div v-else-if="error" style="color:#c00">{{ error }}</div>
    <table v-else style="width:100%;border-collapse:collapse">
      <thead><tr>
        <th>ID</th><th>Date</th><th>Client</th><th>Montant</th><th>Statut</th><th>Action</th>
      </tr></thead>
      <tbody>
        <tr v-for="o in items" :key="o.id">
          <td>{{ o.id }}</td>
          <td>{{ fmtDate(o.createdAt) }}</td>
          <td>{{ o.customerName || '—' }}</td>
          <td style="text-align:right">{{ fmtPrice(o.total || 0) }}</td>
          <td>{{ o.status || '—' }}</td>
          <td>
            <select v-model="nextStatus[o.id]">
              <option disabled value="">(choisir)</option>
              <option>PAID</option>
              <option>SHIPPED</option>
              <option>CANCELLED</option>
            </select>
            <button @click="updateStatus(o.id)">OK</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p style="color:#777;margin-top:.6rem">Total: {{ total }} — Page: {{ page }}</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const items = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const status = ref('')
const from = ref('')
const to = ref('')
const nextStatus = ref({})
const loading = ref(false)
const error = ref('')
function qs(obj){ return Object.entries(obj).filter(([,v])=>v!==''&&v!=null).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') }
function fmtPrice(n){ try { return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(Number(n)) } catch { return n } }
function fmtDate(s){ return s ? new Date(s).toLocaleString('fr-FR') : '—' }
async function load(){
  loading.value = true; error.value=''
  try{
    const query = qs({ page: page.value, limit: limit.value, status: status.value, from: from.value, to: to.value })
    const r = await fetch(`/api/admin/orders?${query}`)
    if(!r.ok) throw new Error('HTTP '+r.status)
    const data = await r.json()
    items.value = data.items || []
    total.value = data.total || 0
  }catch(e){ error.value = String(e?.message||e) }
  finally{ loading.value=false }
}
async function updateStatus(id){
  const ns = nextStatus.value[id]
  if(!ns) return
  try{
    const r = await fetch(`/api/admin/orders/${id}/status`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ status: ns })
    })
    if(!r.ok) throw new Error('HTTP '+r.status)
    await load()
  }catch(e){ alert('Maj statut: '+(e?.message||e)) }
}
function openInNew(url){ const a=document.createElement('a'); a.href=url; a.target='_blank'; a.rel='noopener'; a.click() }
function exportCsv(){ const q = qs({ status: status.value, from: from.value, to: to.value }); openInNew(`/api/admin/orders/export.csv?${q}`) }
function exportPdf(){ const q = qs({ status: status.value, from: from.value, to: to.value }); openInNew(`/api/admin/orders/export.pdf?${q}`) }
onMounted(load)
</script>
<style>
table th, table td { border-bottom:1px solid #eee; padding:.45rem }
button { cursor:pointer;border:1px solid #ddd;border-radius:8px;padding:.35rem .6rem;background:#fafafa }
button:hover { background:#f0f0f0 }
</style>
