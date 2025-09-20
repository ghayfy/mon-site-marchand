<template>
  <div class="max-w-md mx-auto mt-10">
    <h2 class="text-2xl font-bold mb-4">Créer un compte</h2>
    <form @submit.prevent="register" class="space-y-3">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="border p-2 w-full"
        required
      />
      <input
        v-model="password"
        type="password"
        placeholder="Mot de passe"
        class="border p-2 w-full"
        required
      />
      <button
        type="submit"
        :disabled="loading"
        class="bg-blue-600 text-white px-4 py-2 w-full"
      >
        {{ loading ? "Création..." : "S'inscrire" }}
      </button>
    </form>

    <p class="mt-3 text-sm">
      Déjà un compte ?
      <router-link to="/login" class="text-blue-500">Se connecter</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue"
import axios from "axios"
import { useRouter } from "vue-router"

const email = ref("")
const password = ref("")
const loading = ref(false)
const router = useRouter()

const register = async () => {
  try {
    loading.value = true
    await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
      email: email.value,
      password: password.value,
    })
    alert("✅ Compte créé avec succès, connectez-vous !")
    router.push("/login")
  } catch (e) {
    console.error(e)
    const msg =
      e.response?.data?.error ||
      e.response?.data?.message ||
      e.message ||
      "Erreur inconnue"
    alert("❌ Erreur : " + msg)
  } finally {
    loading.value = false
  }
}
</script>
