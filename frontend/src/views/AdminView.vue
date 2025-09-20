<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';
import { useRouter } from 'vue-router';

const router = useRouter();
const cats = ref([]);
const prods = ref([]);

const catName = ref('');
const prodForm = ref({
  title:'', description:'', priceHT: 0, tva:20, stock:0, weight:0,
  categoryId:null, active:true
});
const loading = ref(false);
const err = ref('');

async function ensureAuth() {
  const t = localStorage.getItem('token');
  if (!t) { router.push('/login'); return false; }
  return true;
}

const loadCats = async () => {
  const { data } = await api.get('/api/categories');
  cats.value = data;
  if (!prodForm.value.categoryId && data[0]) prodForm.value.categoryId = data[0].id;
};
const loadProds = async () => {
  const { data } = await api.get('/api/products');
  prods.value = data;
};

const createCat = async () => {
  try {
    if (!await ensureAuth()) return;
    if (!catName.value) return;
    loading.value = true; err.value='';
    await api.post('/api/categories', { name: catName.value });
    catName.value = '';
    await loadCats();
  } catch (e) {
    err.value = e?.response?.data?.error || e.message;
  } finally { loading.value = false; }
};

const createProd = async () => {
  try {
    if (!await ensureAuth()) return;
    loading.value = true; err.value='';
    const body = { ...prodForm.value };
    body.priceHT = Number(body.priceHT);
    body.tva = Number(body.tva);
    body.stock = Number(body.stock);
    body.weight = Number(body.weight);
    await api.post('/api/products', body);
    await loadProds();
  } catch (e) {
    err.value = e?.response?.data?.error || e.message;
  } finally { loading.value = false; }
};

onMounted(async () => {
  await loadCats();
  await loadProds();
});
</script>

<template>
  <div class="wrap">
    <h1>Admin</h1>
    <p v-if="err" class="err">Erreur: {{ err }}</p>

    <section>
      <h2>Catégories</h2>
      <div class="row">
        <input v-model="catName" placeholder="Nom de la catégorie" />
        <button :disabled="loading" @click="createCat">Ajouter</button>
      </div>
      <ul>
        <li v-for="c in cats" :key="c.id">{{ c.id }} — {{ c.name }} ({{ c.slug }})</li>
      </ul>
    </section>

    <section>
      <h2>Produits</h2>
      <div class="form">
        <input v-model="prodForm.title" placeholder="Titre" />
        <textarea v-model="prodForm.description" placeholder="Description"></textarea>
        <div class="row">
          <label>Prix HT <input v-model="prodForm.priceHT" type="number" step="0.01"/></label>
          <label>TVA <input v-model="prodForm.tva" type="number" step="1"/></label>
          <label>Stock <input v-model="prodForm.stock" type="number" step="1"/></label>
          <label>Poids(kg) <input v-model="prodForm.weight" type="number" step="0.01"/></label>
        </div>
        <div class="row">
          <label>Catégorie
            <select v-model="prodForm.categoryId">
              <option v-for="c in cats" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </label>
          <label>Actif
            <input type="checkbox" v-model="prodForm.active" />
          </label>
          <button :disabled="loading" @click="createProd">Créer</button>
        </div>
      </div>

      <table class="tbl" v-if="prods.length">
        <thead><tr><th>ID</th><th>Titre</th><th>Catégorie</th><th>Prix TTC</th><th>Stock</th></tr></thead>
        <tbody>
          <tr v-for="p in prods" :key="p.id">
            <td>{{ p.id }}</td>
            <td>{{ p.title }}</td>
            <td>{{ p.category?.name || '—' }}</td>
            <td>{{ (p.priceHT * (1 + (p.tva || 0)/100)).toFixed(2) }} €</td>
            <td>{{ p.stock }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.wrap { max-width: 1000px; margin: 2rem auto; padding: 1rem; }
section { margin-bottom: 2rem; }
.row { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
.form input, .form textarea, .form select { padding:.5rem; }
.tbl { width:100%; border-collapse: collapse; }
.tbl th, .tbl td { border:1px solid #eee; padding:.5rem; text-align:left; }
.err { color:#b00020; }
</style>
