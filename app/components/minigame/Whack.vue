<template>
  <div class="w-full flex flex-col gap-3">
    <div class="flex items-center justify-between font-display text-ink text-2xl font-extrabold leading-none tabular-nums">
      <span>{{ score }} pts</span>
      <span>{{ remaining === null ? '15.0' : (remaining / 1000).toFixed(1) }} s</span>
    </div>
    <div class="w-full h-[min(20rem,50dvh)] grid grid-cols-3 grid-rows-3 gap-2 bg-board rounded-xl select-none touch-manipulation p-2">
      <button
        v-for="i in 9"
        :key="i"
        type="button"
        class="min-h-0 flex items-center justify-center bg-board-line active:bg-mesa-500 rounded-xl transition-colors duration-100"
        :aria-label="`Casilla ${i}`"
        @pointerdown="hit(i - 1)"
      >
        <span v-if="target === i - 1" class="size-12 bg-accent rounded-full" />
      </button>
    </div>
    <p v-if="remaining === null" class="text-center text-muted text-sm">Tocá cualquier casilla para arrancar</p>
  </div>
</template>

<script setup>
const DURATION_MS = 15000

const emit = defineEmits(['finish'])

const score = ref(0)
const target = ref(null)
const remaining = ref(null)
let endsAt = 0
let frame = null
let moveTimer = null

function moveTarget() {
  let next = Math.floor(Math.random() * 9)
  if (next === target.value) next = (next + 1) % 9
  target.value = next
  const elapsed = DURATION_MS - (remaining.value ?? DURATION_MS)
  moveTimer = setTimeout(moveTarget, Math.max(450, 1000 - elapsed / 30))
}

function tick() {
  remaining.value = Math.max(0, endsAt - performance.now())
  if (remaining.value === 0) {
    clearTimeout(moveTimer)
    target.value = null
    emit('finish', score.value)
    return
  }
  frame = requestAnimationFrame(tick)
}

function hit(i) {
  if (remaining.value === 0) return
  if (remaining.value === null) {
    endsAt = performance.now() + DURATION_MS
    remaining.value = DURATION_MS
    frame = requestAnimationFrame(tick)
    moveTarget()
    return
  }
  if (i === target.value) {
    score.value++
    clearTimeout(moveTimer)
    moveTarget()
  } else {
    score.value = Math.max(0, score.value - 1)
  }
}

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  clearTimeout(moveTimer)
})
</script>
