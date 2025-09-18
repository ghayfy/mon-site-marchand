<template>
  <div style="max-width:1100px;margin:2rem auto;font-family:system-ui,-apple-system,Segoe UI,Roboto">
    <h2>Admin – Catalogue (lecture)</h2>
    <div v-if="loading">Chargement…</div>
    <div v-else-if="error" style="color:#c00">{{ error }}</div>
    <table v-else style="width:100%;border-collapse:collapse">
      <thead><tr><th>ID</th><th>Nom</th><th>Prix</th></tr></thead>
      <tbody>
        <tr v-for="p in items" :key="p.id">
          <td>{{ p.id }}</td>
          <td>{{ p.name }}</td>
          <td style="text-align:right">{{ fmtPrice(p.price) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const items = ref([]), loading = ref(false), error = ref('')
function fmtPrice(n){ try { return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(Number(n)) } catch { return n } }
async function load(){
  loading.value=true; error.value=''
  try{
    const r = await fetch('/api/admin/products?limit=50')
    if(!r.ok) throw new Error('HTTP '+r.status)
    const data = await r.json()
    items.value = data.items || []
  }catch(e){ error.value = String(e?.message||e) }
  finally{ loading.value=false }
}
onMounted(load)
</script>
<style>
table th, table td { border-bottom:1px solid #eee; padding:.45rem }
</style>
