<template>
  <div>
    <h2>Connexion</h2>
    <form @submit.prevent="submit">
      <input v-model="email" placeholder="Email" type="email" required />
      <input v-model="password" placeholder="Mot de passe" type="password" required />
      <button>Se connecter</button>
    </form>
    <p v-if="error" style="color:red">{{ error }}</p>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
const store = useStore(); const router = useRouter();
const email = ref('admin@example.com'); const password = ref('admin123'); const error = ref('');
const submit = async () => { try { await store.dispatch('auth/login', { email: email.value, password: password.value }); router.push('/'); } catch(e){ error.value = e?.response?.data?.error || e.message; }};
</script>
