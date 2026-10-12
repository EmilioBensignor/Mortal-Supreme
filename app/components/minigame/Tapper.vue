<template>
  <button
    type="button"
    class="w-full h-[min(20rem,50dvh)] flex flex-col items-center justify-center gap-2 bg-board active:bg-board-line rounded-xl text-board-fg text-center select-none touch-manipulation"
    @pointerdown="tap"
  >
    <span class="font-display text-8xl font-extrabold leading-none tabular-nums">{{ taps }}</span>
    <span class="text-board-dim text-sm tabular-nums">
      {{ remaining === null ? 'Tocá para arrancar' : `${(remaining / 1000).toFixed(1)} s` }}
    </span>
  </button>
</template>

<script setup>
const DURATION_MS = 5000

const emit = defineEmits(['finish'])

const taps = ref(0)
const remaining = ref(null)
let endsAt = 0
let frame = null

function tick() {
  remaining.value = Math.max(0, endsAt - performance.now())
  if (remaining.value === 0) {
    emit('finish', taps.value)
    return
  }
  frame = requestAnimationFrame(tick)
}

function tap() {
  if (remaining.value === 0) return
  if (remaining.value === null) {
    endsAt = performance.now() + DURATION_MS
    frame = requestAnimationFrame(tick)
  }
  taps.value++
}

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>
