<template>
  <div
    ref="boxRef"
    class="w-full h-[min(20rem,50dvh)] relative bg-board rounded-xl select-none touch-manipulation overflow-hidden"
    @pointerdown="tap"
  >
    <div class="h-1/4 absolute inset-x-0 bottom-0 bg-accent/25 border-t-2 border-dashed border-accent" />
    <div
      class="size-8 absolute top-0 left-1/2 bg-white border-2 border-solid border-accent rounded-full shadow-lg shadow-black/40"
      :style="{ transform: `translate(-50%, ${y}px)` }"
    />
    <div class="absolute top-3 inset-x-0 flex flex-col items-center gap-1 text-center pointer-events-none">
      <span class="font-display text-board-fg text-5xl font-extrabold leading-none tabular-nums">{{ hits }}</span>
      <span v-if="!running" class="text-board-dim text-sm">Tocá para arrancar</span>
    </div>
  </div>
</template>

<script setup>
const BALL_SIZE = 32
const BASE_GRAVITY = 900
const BOUNCE_HEIGHT_RATIO = 0.75

const emit = defineEmits(['finish'])

const boxRef = ref(null)
const y = ref(40)
const hits = ref(0)
const running = ref(false)
let vy = 0
let gravity = BASE_GRAVITY
let last = 0
let frame = null

function boxHeight() {
  return boxRef.value?.clientHeight ?? 320
}

function bounceVelocity() {
  return -Math.sqrt(2 * gravity * boxHeight() * BOUNCE_HEIGHT_RATIO)
}

function step(now) {
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  vy += gravity * dt
  y.value = Math.max(0, y.value + vy * dt)
  if (y.value > boxHeight()) {
    running.value = false
    emit('finish', hits.value)
    return
  }
  frame = requestAnimationFrame(step)
}

function tap() {
  if (!running.value) {
    if (hits.value > 0) return
    running.value = true
    vy = 0
    last = performance.now()
    frame = requestAnimationFrame(step)
    return
  }
  const zoneTop = boxHeight() * 0.75 - BALL_SIZE
  if (y.value < zoneTop || vy < 0) {
    cancelAnimationFrame(frame)
    running.value = false
    emit('finish', hits.value)
    return
  }
  hits.value++
  gravity = BASE_GRAVITY * (1 + hits.value * 0.08)
  vy = bounceVelocity()
}

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>
