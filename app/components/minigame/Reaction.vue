<template>
  <button
    type="button"
    class="w-full h-[min(20rem,50dvh)] flex flex-col items-center justify-center gap-2 rounded-xl text-center select-none touch-manipulation px-6"
    :class="STATE_CLASSES[state]"
    @pointerdown="tap"
  >
    <span class="font-display text-2xl font-bold uppercase tracking-wider">{{ STATE_LABELS[state] }}</span>
    <span v-if="lastTime !== null && state !== 'go'" class="font-display text-3xl font-extrabold tabular-nums">{{ lastTime }} ms</span>
    <span class="text-sm">Intento {{ Math.min(times.length + 1, TRIES) }} de {{ TRIES }}</span>
  </button>
</template>

<script setup>
const TRIES = 3
const STATE_LABELS = { idle: 'Tocá para empezar', wait: 'Esperá…', go: '¡Ahora!', early: '¡Temprano! Tocá para reintentar' }
const STATE_CLASSES = {
  idle: 'bg-board text-board-fg',
  wait: 'bg-loss text-white',
  go: 'bg-win text-white',
  early: 'bg-accent text-white',
}

const emit = defineEmits(['finish'])

const state = ref('idle')
const times = ref([])
const lastTime = ref(null)
let startedAt = 0
let timer = null

function tap() {
  if (state.value === 'idle' || state.value === 'early') {
    state.value = 'wait'
    timer = setTimeout(() => {
      startedAt = performance.now()
      state.value = 'go'
    }, 1200 + Math.random() * 2800)
    return
  }
  if (state.value === 'wait') {
    clearTimeout(timer)
    state.value = 'early'
    return
  }
  lastTime.value = Math.round(performance.now() - startedAt)
  times.value.push(lastTime.value)
  if (times.value.length === TRIES) {
    emit('finish', Math.round(times.value.reduce((a, b) => a + b, 0) / TRIES))
    return
  }
  state.value = 'idle'
}

onBeforeUnmount(() => clearTimeout(timer))
</script>
