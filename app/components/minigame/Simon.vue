<template>
  <div class="w-full flex flex-col gap-3">
    <div class="w-full h-[min(20rem,50dvh)] grid grid-cols-2 gap-3 select-none touch-manipulation">
      <button
        v-for="(pad, i) in PADS"
        :key="pad"
        type="button"
        class="rounded-xl transition-all duration-150"
        :class="[pad, lit === i ? 'opacity-100 scale-[0.97] brightness-125' : 'opacity-35']"
        :disabled="phase !== 'input'"
        :aria-label="`Color ${i + 1}`"
        @pointerdown="press(i)"
      />
    </div>
    <p class="text-center text-muted text-sm">
      <template v-if="phase === 'idle'">
        <button type="button" class="text-accent font-semibold active:opacity-70" @click="nextLevel">Tocá acá para arrancar</button>
      </template>
      <template v-else-if="phase === 'show'">Mirá la secuencia…</template>
      <template v-else>Tu turno · nivel {{ sequence.length }}</template>
    </p>
  </div>
</template>

<script setup>
const PADS = ['bg-mesa-500', 'bg-accent', 'bg-win', 'bg-gold']
const FLASH_MS = 420
const GAP_MS = 180

const emit = defineEmits(['finish'])

const sequence = ref([])
const phase = ref('idle')
const lit = ref(null)
let inputIndex = 0
let timers = []

function later(fn, ms) {
  timers.push(setTimeout(fn, ms))
}

function nextLevel() {
  sequence.value.push(Math.floor(Math.random() * PADS.length))
  phase.value = 'show'
  inputIndex = 0
  sequence.value.forEach((pad, i) => {
    later(() => { lit.value = pad }, 500 + i * (FLASH_MS + GAP_MS))
    later(() => { lit.value = null }, 500 + i * (FLASH_MS + GAP_MS) + FLASH_MS)
  })
  later(() => { phase.value = 'input' }, 500 + sequence.value.length * (FLASH_MS + GAP_MS))
}

function press(i) {
  if (phase.value !== 'input') return
  lit.value = i
  later(() => { if (lit.value === i) lit.value = null }, 150)
  if (sequence.value[inputIndex] !== i) {
    phase.value = 'done'
    emit('finish', sequence.value.length - 1)
    return
  }
  inputIndex++
  if (inputIndex === sequence.value.length) {
    phase.value = 'show'
    later(nextLevel, 400)
  }
}

onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>
