<template>
  <UModal
    :open="open"
    :title="game.name"
    :description="player ? `Juega ${player.name}` : 'Minijuego del turno'"
    :dismissible="step !== 'play'"
    :ui="{ content: 'max-w-md', body: 'flex flex-col gap-4' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <template v-if="step === 'who'">
        <p class="text-muted text-sm">¿Quién sos?</p>
        <div class="grid grid-cols-2 gap-2">
          <UButton
            v-for="p in waitingPlayers"
            :key="p.id"
            block
            size="lg"
            variant="outline"
            color="neutral"
            class="min-w-0"
            @click="choosePlayer(p)"
          >
            <span class="truncate">{{ p.name }}</span>
          </UButton>
        </div>
      </template>

      <template v-else-if="step === 'intro'">
        <p class="text-muted text-sm">{{ game.description }}</p>
        <UButton block size="lg" color="secondary" icon="i-lucide-play" class="font-display font-bold uppercase tracking-wider" @click="play">
          Jugar
        </UButton>
      </template>

      <component :is="GAME_COMPONENTS[game.key]" v-else-if="step === 'play'" :key="playKey" @finish="finish" />

      <template v-else-if="step === 'result'">
        <div
          class="flex flex-col items-center gap-1 bg-board rounded-xl text-center px-4 py-5"
          role="status"
        >
          <p v-if="isRecord" class="bg-accent rounded-md font-display text-white text-xs font-bold uppercase tracking-widest px-2 py-1">¡Nuevo récord!</p>
          <p class="font-display text-board-fg text-7xl font-extrabold leading-none tabular-nums">{{ lastScore }}</p>
          <p class="text-board-dim text-sm">{{ game.unit }}</p>
        </div>
        <p v-if="error" class="text-error text-sm" role="alert">No se pudo guardar el puntaje.</p>
        <UButton block size="lg" color="secondary" icon="i-lucide-rotate-cw" class="font-display font-bold uppercase tracking-wider" @click="play">Otra vez</UButton>
      </template>

      <ol v-if="step !== 'play' && step !== 'who' && scores.length > 0" class="flex flex-col" aria-label="Highscores">
        <li
          v-for="(row, i) in scores"
          :key="row.id"
          class="flex items-center gap-3 border-solid border-line not-first:border-t px-3 py-2"
          :class="row.id === lastScoreId ? 'bg-accent-soft' : ''"
        >
          <div class="size-7 flex items-center justify-center shrink-0 rounded-full font-display text-xs font-bold" :class="MEDAL_CLASSES[i] ?? 'bg-sunken text-muted'">
            {{ i + 1 }}
          </div>
          <span class="flex-1 min-w-0 text-ink text-sm font-semibold truncate">{{ row.player?.name ?? '?' }}</span>
          <span class="shrink-0 font-display text-ink text-xl font-extrabold tabular-nums">{{ row.score }}</span>
        </li>
      </ol>
    </template>
  </UModal>
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  game: { type: Object, required: true },
  waitingPlayers: { type: Array, required: true },
  tournamentId: { type: String, default: null },
})
const emit = defineEmits(['update:open'])

const MEDAL_CLASSES = ['bg-gold text-ink', 'bg-silver text-ink', 'bg-bronze text-ink']

const GAME_COMPONENTS = {
  reaction: resolveComponent('MinigameReaction'),
  tapper: resolveComponent('MinigameTapper'),
  paddle: resolveComponent('MinigamePaddle'),
  simon: resolveComponent('MinigameSimon'),
  whack: resolveComponent('MinigameWhack'),
}

const { scores, error, load, save } = useMinigameScores()

const player = ref(null)
const step = ref('who')
const playKey = ref(0)
const lastScore = ref(null)
const lastScoreId = ref(null)
const isRecord = ref(false)

function choosePlayer(p) {
  player.value = p
  step.value = 'intro'
}

function play() {
  playKey.value++
  step.value = 'play'
}

async function finish(score) {
  const best = scores.value[0]?.score
  isRecord.value = best === undefined || (props.game.lowerIsBetter ? score < best : score > best)
  lastScore.value = score
  lastScoreId.value = null
  step.value = 'result'
  try {
    lastScoreId.value = await save({
      game: props.game,
      playerId: player.value.id,
      tournamentId: props.tournamentId,
      score,
    })
    await load(props.game)
  } catch {
    isRecord.value = false
  }
}

watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  player.value = props.waitingPlayers.length === 1 ? props.waitingPlayers[0] : null
  step.value = player.value ? 'intro' : 'who'
  lastScoreId.value = null
  load(props.game)
}, { immediate: true })
</script>
