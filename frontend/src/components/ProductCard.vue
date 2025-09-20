<template>
  <article class="card">
    <img v-if="product.imageUrl" :src="product.imageUrl" alt="" />
    <h3>{{ product.name }}</h3>
    <p v-if="product.Promo">
      <s>{{ product.price }} €</s>
      <strong>{{ discounted.toFixed(2) }} €</strong>
    </p>
    <p v-else><strong>{{ product.price }} €</strong></p>
    <button @click="addToCart">Ajouter au panier</button>
  </article>
</template>
<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
const props = defineProps({ product: { type: Object, required: true } });
const store = useStore();
const discounted = computed(() => {
  const p = props.product;
  if (!p.Promo) return Number(p.price);
  const value = Number(p.Promo.value);
  return p.Promo.type === 'percentage' ? Number(p.price) * (1 - value / 100) : Math.max(0, Number(p.price) - value);
});
const addToCart = () => store.dispatch('cart/add', { productId: props.product.id, quantity: 1 });
</script>
<style>
.card { border:1px solid #eee; border-radius:8px; padding:12px; }
img { max-width: 100%; border-radius: 8px; }
</style>
