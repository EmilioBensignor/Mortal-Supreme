<script setup>
definePageMeta({ layout: false })

const route = useRoute()
const config = useRuntimeConfig()
const expectedPin = config.public.appPin

const pin = ref('')
const error = ref(null)
const inputRef = ref(null)

onMounted(() => {
  // Si ya está bien guardado, redirigir
  if (window.localStorage.getItem('app-pin') === expectedPin) {
    redirect()
  }
  inputRef.value?.focus()
})

function redirect() {
  const r = route.query.redirect
  navigateTo(typeof r === 'string' && r.startsWith('/') ? r : '/')
}

function submit() {
  if (pin.value === expectedPin) {
    window.localStorage.setItem('app-pin', pin.value)
    redirect()
  } else {
    error.value = 'PIN incorrecto'
    pin.value = ''
    inputRef.value?.focus()
  }
}
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
    <div class="flex flex-col items-center gap-3 text-center">
      <img src="/icon.svg" class="size-20" alt="">
      <h1 class="text-light text-2xl font-display font-bold uppercase tracking-wide">Mortal Supreme</h1>
      <p class="text-pingpong-300 text-sm">Ingresá el PIN para continuar</p>
    </div>

    <form class="w-full max-w-xs flex flex-col gap-3" @submit.prevent="submit">
      <input
        ref="inputRef"
        v-model="pin"
        type="password"
        inputmode="numeric"
        autocomplete="off"
        placeholder="PIN"
        class="w-full bg-pingpong-900 border-2 border-solid border-pingpong-700/50 rounded-2xl text-light text-center text-2xl font-mono-num font-bold tracking-[0.4em] px-4 py-4"
        :class="error ? 'border-error/60' : ''"
        @input="error = null"
      >
      <p v-if="error" class="text-error text-sm text-center">{{ error }}</p>
      <UButton
        type="submit"
        block
        size="xl"
        color="secondary"
        :disabled="!pin"
        class="glow-secondary"
      >
        Entrar
      </UButton>
    </form>
  </div>
</template>
