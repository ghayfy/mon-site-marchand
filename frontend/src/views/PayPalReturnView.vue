<script setup>
import axios from 'axios'
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  const orderId = route.query.token // PayPal renvoie token=EC-...
  if (!orderId) return router.replace('/')
  try {
    const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/paypal/capture/${orderId}`)
    alert('Paiement PayPal capturé : ' + data.status)
    router.replace('/cart')
  } catch (e) {
    alert('Erreur capture PayPal: ' + (e.response?.data?.error || e.message))
    router.replace('/cart')
  }
})
</script>

<template>
  <div class="p-6">Traitement du retour PayPal...</div>
</template>
