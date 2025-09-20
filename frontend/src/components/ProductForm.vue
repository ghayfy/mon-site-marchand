<template>
  <form @submit.prevent="submit">
    <h3>{{ local.id ? 'Modifier' : 'Créer' }} un produit</h3>
    <div class="grid">
      <input v-model="local.name" placeholder="Nom" required />
      <input v-model.number="local.price" placeholder="Prix" type="number" step="0.01" required />
      <input v-model="local.imageUrl" placeholder="Image URL" />
      <input v-model.number="local.stock" placeholder="Stock" type="number" />
      <input v-model.number="local.weight" placeholder="Poids (kg)" type="number" step="0.001" />
      <input v-model.number="local.categoryId" placeholder="ID Catégorie" type="number" />
      <input v-model.number="local.promoId" placeholder="ID Promo (optionnel)" type="number" />
    </div>
    <textarea v-model="local.description" placeholder="Description"></textarea>
    <button>{{ local.id ? 'Mettre à jour' : 'Créer' }}</button>
    <button type="button" @click="$emit('save', {})" style="margin-left:8px">Réinitialiser</button>
  </form>
</template>
<script setup>
import { reactive, watch } from 'vue';
const props = defineProps({ modelValue: { type: Object, default: null } });
const emit = defineEmits(['save']);
const local = reactive({ id:null, name:'', price:0, imageUrl:'', stock:0, weight:0, categoryId:null, promoId:null, description:'' });
watch(() => props.modelValue, (v) => {
  Object.assign(local, v || { id:null, name:'', price:0, imageUrl:'', stock:0, weight:0, categoryId:null, promoId:null, description:'' });
}, { immediate: true });
const submit = () => emit('save', { ...local });
</script>
<style>
.grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
textarea { width:100%; min-height: 80px; margin-top: 8px; }
</style>
