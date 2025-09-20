<template>
  <div>
    <h2>Mes adresses</h2>
    <form @submit.prevent="save">
      <div class="grid">
        <input v-model="form.fullName" placeholder="Nom complet" required />
        <input v-model="form.phone" placeholder="Téléphone" />
        <select v-model="form.type">
          <option value="shipping">Livraison</option>
          <option value="billing">Facturation</option>
        </select>
        <input v-model="form.line1" placeholder="Adresse ligne 1" required />
        <input v-model="form.line2" placeholder="Adresse ligne 2" />
        <input v-model="form.city" placeholder="Ville" required />
        <input v-model="form.zip" placeholder="Code postal" required />
        <input v-model="form.country" placeholder="Pays" required />
      </div>
      <button>{{ form.id ? 'Mettre à jour' : 'Ajouter' }}</button>
    </form>
    <hr />
    <table border="1" cellpadding="6">
      <thead><tr><th>Type</th><th>Nom</th><th>Adresse</th><th>Défaut</th><th>Actions</th></tr></thead>
      <tbody>
        <tr v-for="a in items" :key="a.id">
          <td>{{ a.type }}</td>
          <td>{{ a.fullName }}</td>
          <td>{{ a.line1 }} {{ a.line2 }} {{ a.zip }} {{ a.city }} {{ a.country }}</td>
          <td>{{ a.isDefault ? 'Oui' : 'Non' }}</td>
          <td>
            <button @click="edit(a)">Edit</button>
            <button @click="del(a.id)">Supprimer</button>
            <button v-if="!a.isDefault" @click="def(a.id)">Définir par défaut</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup>
import { reactive, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
const store = useStore();
const items = computed(() => store.state.addresses.items);
const form = reactive({ id:null, type:'shipping', fullName:'', phone:'', line1:'', line2:'', city:'', zip:'', country:'FR' });
const edit = (a) => Object.assign(form, a);
const reset = () => Object.assign(form, { id:null, type:'shipping', fullName:'', phone:'', line1:'', line2:'', city:'', zip:'', country:'FR' });
const save = async () => { if (form.id) await store.dispatch('addresses/update', form); else await store.dispatch('addresses/create', form); reset(); };
const del = async (id) => { await store.dispatch('addresses/remove', id); };
const def = async (id) => { await store.dispatch('addresses/setDefault', id); };
onMounted(() => store.dispatch('addresses/list'));
</script>
<style>
.grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; }
</style>
