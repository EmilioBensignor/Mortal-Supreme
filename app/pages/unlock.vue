<template>
  <div class="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
    <div class="flex flex-col items-center gap-3 text-center">
      <img src="/icon.svg" class="size-20" alt="">
      <h1 class="font-display text-ink text-3xl font-extrabold leading-none uppercase">Mortal Supreme</h1>
      <p class="text-muted text-sm">Ingresá el PIN para continuar</p>
    </div>

    <form class="w-full max-w-xs flex flex-col gap-3" @submit.prevent="submit">
      <input
        ref="inputRef"
        v-model="pin"
        type="password"
        inputmode="numeric"
        autocomplete="off"
        placeholder="PIN"
        class="w-full bg-surface border-2 border-solid rounded-xl text-ink text-center font-display text-3xl font-bold tracking-[0.4em] px-4 py-3"
        :class="error ? 'border-loss' : 'border-line'"
        @input="error = null"
      >
      <p v-if="error" class="text-loss text-sm text-center">{{ error }}</p>
      <UButton
        type="submit"
        block
        size="xl"
        color="secondary"
        :disabled="!pin"
        class="min-h-13 font-display text-base font-bold uppercase tracking-wider"
      >
        Entrar
      </UButton>
    </form>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

const route = useRoute()
const config = useRuntimeConfig()
const expectedPin = String(config.public.appPin ?? '')

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
  const entered = String(pin.value).trim()
  if (entered === expectedPin) {
    window.localStorage.setItem('app-pin', entered)
    redirect()
  } else {
    error.value = 'PIN incorrecto'
    pin.value = ''
    inputRef.value?.focus()
  }
}
</script>
