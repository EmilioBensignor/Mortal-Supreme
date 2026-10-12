<template>
  <div v-if="tournamentStore.tournament" class="flex flex-col gap-5 max-w-full overflow-x-hidden">
    <header class="flex flex-col gap-2">
      <NuxtLink to="/" class="flex items-center w-fit gap-1 text-muted text-sm transition-opacity active:opacity-70">
        <UIcon name="i-lucide-chevron-left" class="size-4" />
        Inicio
      </NuxtLink>
      <div class="flex items-center justify-between gap-3">
        <h1 class="min-w-0 font-display text-ink text-3xl font-extrabold leading-none uppercase truncate">{{ tournamentStore.tournament.name }}</h1>
        <UBadge v-if="!finished" color="neutral" variant="outline" class="shrink-0 font-display text-sm font-bold uppercase tracking-wider">
          Round {{ tournamentStore.currentRound?.round_number ?? '–' }}
        </UBadge>
        <UBadge v-else color="neutral" variant="outline" class="shrink-0 font-display text-sm font-bold uppercase tracking-wider">Finalizado</UBadge>
      </div>
    </header>

    <!-- FINALIZADO -->
    <section v-if="finished && leader" class="flex flex-col items-center gap-2 bg-board rounded-xl px-6 py-8">
      <UIcon name="i-lucide-trophy" class="size-16 text-gold" />
      <p class="font-display text-board-dim text-sm font-bold uppercase tracking-widest">Campeón</p>
      <h2 class="font-display text-board-fg text-5xl font-extrabold leading-none text-center uppercase wrap-break-word">
        {{ playerName(tournamentStore.tournament.winner_player_id) }}
      </h2>
    </section>

    <!-- EN CURSO: jugando ahora -->
    <section v-if="!finished" class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">Jugando ahora</h2>
        <span v-if="currentTurnNumber" class="font-display text-ink text-sm font-bold uppercase tracking-wider tabular-nums">
          Turno {{ currentTurnNumber }}
        </span>
      </div>
      <div v-if="tournamentStore.currentTurnMatches.length === 0" class="bg-surface border border-solid border-line rounded-xl text-center text-muted text-sm px-4 py-6">
        Round terminada. Generá la próxima abajo.
      </div>
      <article
        v-for="m in tournamentStore.currentTurnMatches"
        :key="m.id"
        class="mesa flex flex-col gap-3 p-3"
      >
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1.5 font-display text-lg font-bold uppercase tracking-wider">
            <UIcon name="i-lucide-table-2" class="size-4" />
            Mesa <span class="tabular-nums">{{ m.table_number }}</span>
          </span>
          <div class="flex items-center gap-2">
            <span v-if="m.status === 'completed'" class="flex items-center gap-1 text-sm font-semibold">
              <UIcon name="i-lucide-check" class="size-4" />
              Jugado
            </span>
            <button
              v-if="m.status === 'completed'"
              type="button"
              class="relative transition-opacity active:opacity-70 p-1"
              aria-label="Editar resultado"
              @click="openEdit(m.id)"
            >
              <UIcon name="i-lucide-pencil" class="size-4" />
            </button>
          </div>
        </div>
        <TournamentWinnerPicker :match="m" @pick="recordWinner(m.id, $event)" />
      </article>
    </section>

    <!-- PARTIDOS EXTRA -->
    <section v-if="!finished && pendingExtras.length > 0" class="flex flex-col gap-3">
      <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">Partidos extra</h2>
      <article
        v-for="m in pendingExtras"
        :key="m.id"
        class="mesa flex flex-col gap-3 p-3"
      >
        <div class="relative self-center bg-mesa-600 text-center px-2">
          <p class="font-display text-lg font-bold uppercase tracking-wider">{{ EXTRA_LABELS[m.match_type] }}</p>
          <p v-if="isDecider(m)" class="text-mesa-100 text-xs">Gana el partido, gana el torneo</p>
        </div>
        <TournamentWinnerPicker :match="m" @pick="recordWinner(m.id, $event)" />
      </article>
    </section>

    <!-- PRÓXIMO TURNO -->
    <section v-if="!finished && tournamentStore.nextTurnMatches.length > 0" class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">Próximo turno</h2>
        <span v-if="nextRestingName" class="text-muted text-sm truncate">Descansa {{ nextRestingName }}</span>
      </div>
      <article
        v-for="m in tournamentStore.nextTurnMatches"
        :key="m.id"
        class="flex flex-col gap-3 bg-surface border-2 border-dashed border-line rounded-xl p-3"
      >
        <div class="flex items-center justify-between gap-2 text-sm">
          <span v-if="m.status === 'completed'" class="flex items-center gap-1 text-win font-semibold">
            <UIcon name="i-lucide-check" class="size-4" />
            Jugado
          </span>
          <span v-else-if="isReady(m)" class="flex items-center gap-1 text-win font-semibold">
            <UIcon name="i-lucide-play" class="size-4" />
            Pueden arrancar
          </span>
          <span v-else class="flex items-center min-w-0 gap-1 text-muted">
            <UIcon name="i-lucide-hourglass" class="size-4 shrink-0" />
            <span class="truncate">Esperando {{ waitingFor(m) }}</span>
          </span>
          <button
            v-if="m.status === 'completed'"
            type="button"
            class="text-muted transition-opacity active:opacity-70 p-1"
            aria-label="Editar resultado"
            @click="openEdit(m.id)"
          >
            <UIcon name="i-lucide-pencil" class="size-4" />
          </button>
        </div>
        <TournamentWinnerPicker :match="m" tone="light" :disabled="!isReady(m)" @pick="recordWinner(m.id, $event)" />
      </article>
    </section>

    <!-- DESCANSANDO -->
    <section
      v-if="!finished && tournamentStore.restingPlayer"
      class="flex items-center gap-3 bg-surface border border-solid border-line rounded-xl p-4"
    >
      <UIcon name="i-lucide-coffee" class="size-8 shrink-0 text-accent" />
      <div class="flex flex-col min-w-0 gap-0.5">
        <p class="font-display text-muted text-sm font-bold uppercase tracking-widest">Descansa</p>
        <p class="font-display text-ink text-3xl font-extrabold leading-none uppercase truncate">{{ tournamentStore.restingPlayer.name }}</p>
        <p class="text-muted text-sm truncate">{{ restMessage }}</p>
      </div>
    </section>

    <!-- MINIJUEGO -->
    <section
      v-if="!finished && turnGame && tournamentStore.waitingPlayers.length > 0"
      class="flex items-center gap-3 bg-surface border border-solid border-line rounded-xl p-4"
    >
      <div class="size-10 flex items-center justify-center shrink-0 bg-accent-soft rounded-xl">
        <UIcon :name="turnGame.icon" class="size-5 text-accent" />
      </div>
      <div class="flex flex-col flex-1 min-w-0 gap-0.5">
        <p class="font-display text-muted text-sm font-bold uppercase tracking-widest">Para el que espera</p>
        <p class="text-ink text-base font-semibold truncate">{{ turnGame.name }}</p>
      </div>
      <UButton color="secondary" icon="i-lucide-gamepad-2" @click="showMinigame = true">Jugar</UButton>
    </section>

    <!-- POSICIONES -->
    <section class="flex flex-col gap-2">
      <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">Posiciones</h2>
      <ul class="flex flex-col bg-surface border border-solid border-line rounded-xl">
        <li
          v-for="(row, i) in tournamentStore.standings"
          :key="row.player_id"
          class="flex items-center gap-3 not-first:border-t border-solid border-line px-4 py-3"
        >
          <div
            class="size-8 flex items-center justify-center shrink-0 rounded-full font-display text-base font-bold tabular-nums"
            :class="i === 0
              ? 'bg-gold text-ink'
              : i === 1
                ? 'bg-silver text-ink'
                : i === 2
                  ? 'bg-bronze text-ink'
                  : 'bg-sunken text-muted'"
          >
            {{ i + 1 }}
          </div>
          <span class="flex-1 min-w-0 text-ink text-base font-semibold truncate">{{ row.player?.name ?? '?' }}</span>
          <div class="flex items-center shrink-0 gap-3">
            <span class="text-muted text-sm tabular-nums">{{ row.wins }}-{{ row.losses }}</span>
            <span class="w-8 font-display text-ink text-3xl font-extrabold leading-none text-right tabular-nums">{{ row.points }}</span>
          </div>
        </li>
      </ul>
    </section>

    <!-- MATCHES JUGADOS -->
    <section v-if="completedMatches.length > 0" class="flex flex-col gap-2">
      <details class="bg-surface border border-solid border-line rounded-xl">
        <summary class="flex items-center justify-between font-display text-muted text-sm font-bold uppercase tracking-widest cursor-pointer transition-opacity active:opacity-70 px-4 py-3">
          <span>Matches jugados <span class="tabular-nums">({{ completedMatches.length }})</span></span>
          <UIcon name="i-lucide-chevron-down" class="size-4" />
        </summary>
        <ul class="flex flex-col">
          <li v-for="m in completedMatches" :key="m.id" class="flex items-center justify-between gap-2 border-t border-solid border-line px-4 py-2.5">
            <div class="flex flex-col min-w-0 gap-0.5 text-sm">
              <div class="truncate">
                <span :class="m.winner_id === m.player1_id ? 'text-win font-bold' : 'text-muted'">
                  {{ playerName(m.player1_id) }}
                </span>
                <span class="text-muted mx-1">vs</span>
                <span :class="m.winner_id === m.player2_id ? 'text-win font-bold' : 'text-muted'">
                  {{ playerName(m.player2_id) }}
                </span>
              </div>
              <div class="text-muted text-xs tabular-nums">
                <span v-if="m.match_type !== 'regular'" class="font-display text-accent uppercase mr-2">{{ m.match_type }}</span>
                <span v-if="m.played_at">{{ new Date(m.played_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) }}</span>
              </div>
            </div>
            <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-pencil" aria-label="Editar resultado" @click="openEdit(m.id)" />
          </li>
        </ul>
      </details>
    </section>

    <!-- ACCIONES -->
    <section v-if="!finished" class="flex flex-col gap-2 pt-2">
      <UButton
        v-if="tournamentStore.currentRound?.status === 'completed'"
        block
        color="secondary"
        size="xl"
        icon="i-lucide-rotate-cw"
        class="min-h-13 font-display text-base font-bold uppercase tracking-wider"
        @click="startNext"
      >
        Nueva round
      </UButton>
      <UButton
        block
        size="xl"
        color="secondary"
        icon="i-lucide-flag"
        :disabled="!leader"
        class="min-h-13 font-display text-base font-bold uppercase tracking-wider"
        @click="openFinish"
      >
        Finalizar torneo
      </UButton>
      <div class="grid grid-cols-2 gap-2">
        <UButton variant="outline" color="neutral" icon="i-lucide-zap" @click="showExtra = true">
          Match extra
        </UButton>
        <UButton variant="outline" color="error" icon="i-lucide-x-circle" @click="abort">
          Cortar ronda
        </UButton>
      </div>
    </section>

    <MinigameModal
      v-if="turnGame"
      v-model:open="showMinigame"
      :game="turnGame"
      :waiting-players="tournamentStore.waitingPlayers"
      :tournament-id="tournamentStore.tournament.id"
    />

    <!-- MODAL FINALIZAR -->
    <UModal
      :open="showFinish"
      title="Finalizar torneo"
      :description="FINISH_DESCRIPTIONS[finishStep]"
      :ui="{ content: 'max-w-md', body: 'flex flex-col gap-4' }"
      @update:open="showFinish = $event"
    >
      <template #body>
        <template v-if="finishStep === 'summary'">
          <div v-if="champion" class="flex flex-col items-center gap-1 bg-sunken border border-solid border-line rounded-xl text-center px-4 py-5">
            <UIcon name="i-lucide-trophy" class="size-8 text-accent" />
            <p class="font-display text-muted text-xs font-bold uppercase tracking-widest">Campeón</p>
            <p class="font-display text-ink text-4xl font-extrabold leading-none uppercase wrap-break-word">{{ champion.name }}</p>
            <p class="text-muted text-sm">{{ championReason }}</p>
          </div>
          <template v-else>
            <UAlert
              color="warning"
              variant="soft"
              icon="i-lucide-scale"
              :title="`Empate en ${leader?.points ?? 0} pts`"
              :description="tiedPlayers.map(p => p.player?.name).join(', ')"
            />
            <div class="grid grid-cols-2 gap-2">
              <UButton block size="lg" variant="outline" color="neutral" icon="i-lucide-hand" @click="finishStep = 'rps'">
                Piedra, papel o tijera
              </UButton>
              <UButton block size="lg" variant="outline" color="neutral" icon="i-lucide-swords" @click="openDecider(tiedPlayers)">
                Jugar desempate
              </UButton>
            </div>
          </template>
          <UButton
            v-if="champion && !decidedBy"
            variant="link"
            color="neutral"
            icon="i-lucide-swords"
            class="self-center"
            @click="openDecider(tournamentStore.standings.slice(0, 2))"
          >
            Definir con muerte súbita
          </UButton>
        </template>

        <template v-else-if="finishStep === 'rps'">
          <p class="text-ink text-sm font-semibold">¿Quién ganó?</p>
          <div class="grid grid-cols-2 gap-2">
            <UButton
              v-for="row in tiedPlayers"
              :key="row.player_id"
              block
              size="lg"
              variant="outline"
              color="neutral"
              class="min-w-0"
              @click="chooseChampion(row.player_id, 'rps')"
            >
              <span class="truncate">{{ row.player?.name }}</span>
            </UButton>
          </div>
        </template>

        <template v-else-if="finishStep === 'match'">
          <p class="text-ink text-sm font-semibold">Elegí quiénes juegan</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="row in tournamentStore.standings"
              :key="row.player_id"
              type="button"
              class="min-h-11 border border-solid rounded-lg text-sm font-semibold transition-colors active:scale-[0.97] px-4"
              :class="deciderPair.includes(row.player_id) ? 'bg-ink border-ink text-white' : 'bg-surface border-line text-ink'"
              :aria-pressed="deciderPair.includes(row.player_id)"
              @click="toggleDecider(row.player_id)"
            >
              {{ row.player?.name }}
            </button>
          </div>
        </template>
      </template>
      <template #footer>
        <div class="w-full flex flex-col gap-2">
          <template v-if="finishStep === 'summary'">
            <template v-if="champion">
              <UButton color="secondary" size="lg" block @click="finish(true)">
                Finalizar y sumar al histórico
              </UButton>
              <UButton variant="soft" color="neutral" block @click="finish(false)">
                Finalizar sin sumar al histórico
              </UButton>
            </template>
            <UButton
              v-if="canPlayAnotherRound"
              variant="outline"
              color="neutral"
              block
              icon="i-lucide-rotate-cw"
              @click="playAnotherRound"
            >
              Jugar otra ronda
            </UButton>
            <UButton variant="ghost" color="neutral" block @click="showFinish = false">Cancelar</UButton>
          </template>
          <template v-else>
            <UButton
              v-if="finishStep === 'match'"
              color="secondary"
              size="lg"
              block
              icon="i-lucide-swords"
              :disabled="deciderPair.length !== 2"
              @click="createDecider"
            >
              Crear partido
            </UButton>
            <UButton variant="ghost" color="neutral" block @click="finishStep = 'summary'">Volver</UButton>
          </template>
        </div>
      </template>
    </UModal>

    <!-- MODAL MATCH EXTRA -->
    <UModal
      :open="showExtra"
      title="Match extra / desempate"
      description="Elegí los dos jugadores y el tipo de match."
      :ui="{ content: 'max-w-md', body: 'flex flex-col gap-3' }"
      @update:open="showExtra = $event"
    >
      <template #body>
        <USelectMenu v-model="extraP1" :items="playerOptions" placeholder="Jugador 1" />
        <USelectMenu v-model="extraP2" :items="playerOptions" placeholder="Jugador 2" />
        <URadioGroup
          v-model="extraType"
          :items="[
            { label: 'Extra (no suma a la liga)', value: 'extra' },
            { label: 'Desempate', value: 'tiebreaker' },
            { label: 'Final', value: 'final' },
          ]"
        />
      </template>
      <template #footer>
        <div class="w-full flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="showExtra = false">Cancelar</UButton>
          <UButton color="secondary" @click="submitExtra">Agregar</UButton>
        </div>
      </template>
    </UModal>

    <!-- MODAL EDITAR RESULTADO -->
    <UModal
      :open="editMatch !== null"
      title="Editar resultado"
      description="Marcá quién ganó realmente este match, o marcalo como no jugado."
      :ui="{ content: 'max-w-md', body: 'flex flex-col gap-4' }"
      @update:open="(v) => !v && closeEdit()"
    >
      <template #body>
        <template v-if="editMatch">
          <UAlert
            v-if="finished"
            color="warning"
            variant="soft"
            icon="i-lucide-triangle-alert"
            description="El torneo ya está finalizado. Cambios pueden afectar el campeón y el histórico."
          />
          <div class="grid grid-cols-2 gap-2">
            <UButton
              block
              size="lg"
              :color="editMatch.winner_id === editMatch.player1_id ? 'success' : 'neutral'"
              :variant="editMatch.winner_id === editMatch.player1_id ? 'solid' : 'outline'"
              :loading="editSaving"
              class="min-w-0"
              @click="changeWinner(editMatch.player1_id)"
            >
              <span class="truncate">{{ playerName(editMatch.player1_id) }}</span>
            </UButton>
            <UButton
              block
              size="lg"
              :color="editMatch.winner_id === editMatch.player2_id ? 'success' : 'neutral'"
              :variant="editMatch.winner_id === editMatch.player2_id ? 'solid' : 'outline'"
              :loading="editSaving"
              class="min-w-0"
              @click="changeWinner(editMatch.player2_id)"
            >
              <span class="truncate">{{ playerName(editMatch.player2_id) }}</span>
            </UButton>
          </div>
          <p v-if="editError" class="text-error text-sm">{{ editError }}</p>
        </template>
      </template>
      <template #footer>
        <div class="w-full flex flex-col gap-2">
          <UButton variant="soft" color="warning" block :loading="editSaving" @click="markUnplayed">
            Marcar como no jugado
          </UButton>
          <UButton variant="ghost" color="neutral" block @click="closeEdit">Cancelar</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
import confetti from 'canvas-confetti'

const route = useRoute()
const tournamentStore = useTournamentStore()
const id = route.params.id
await tournamentStore.load(id)

const FINISH_DESCRIPTIONS = {
  summary: 'Se cierra el torneo y se corona al campeón.',
  rps: 'Registrá quién ganó el piedra, papel o tijera.',
  match: 'Se juega un partido y el que gana se lleva el torneo.',
}
const EXTRA_LABELS = { extra: 'Match extra', tiebreaker: 'Desempate', final: 'Final' }

const showFinish = ref(false)
const finishStep = ref('summary')
const chosenWinnerId = ref(null)
const decidedBy = ref(null)
const deciderPair = ref([])
const showExtra = ref(false)
const showMinigame = ref(false)
const extraP1 = ref('')
const extraP2 = ref('')
const extraType = ref('extra')

const editMatchId = ref(null)
const editMatch = computed(() => {
  if (!editMatchId.value) return null
  return tournamentStore.matches.find(m => m.id === editMatchId.value) ?? null
})
const editError = ref(null)
const editSaving = ref(false)

function playerName(pid) {
  return tournamentStore.players.find(p => p.id === pid)?.name ?? '?'
}

const restMessage = computed(() => {
  return useRestMessage(tournamentStore.currentTurn?.id ?? 'none')
})

async function recordWinner(matchId, winnerId) {
  const match = tournamentStore.matches.find(m => m.id === matchId)
  await tournamentStore.recordWinner(matchId, winnerId)
  if (match && isDecider(match)) {
    openFinish()
    chooseChampion(winnerId, 'match')
    return
  }
  if (allMatchesDone.value) openFinish()
}

function isDecider(match) {
  return !match.turn_id && (match.match_type === 'tiebreaker' || match.match_type === 'final')
}

function openFinish() {
  finishStep.value = 'summary'
  chosenWinnerId.value = null
  decidedBy.value = null
  showFinish.value = true
}

function chooseChampion(playerId, reason) {
  chosenWinnerId.value = playerId
  decidedBy.value = reason
  finishStep.value = 'summary'
}

function openDecider(rows) {
  deciderPair.value = rows.slice(0, 2).map(r => r.player_id)
  finishStep.value = 'match'
}

function toggleDecider(playerId) {
  if (deciderPair.value.includes(playerId)) {
    deciderPair.value = deciderPair.value.filter(id => id !== playerId)
    return
  }
  deciderPair.value = [...deciderPair.value, playerId].slice(-2)
}

async function createDecider() {
  const [p1, p2] = deciderPair.value
  await tournamentStore.addExtraMatch(p1, p2, 'tiebreaker')
  showFinish.value = false
}

const allMatchesDone = computed(() => {
  if (tournamentStore.matches.length === 0) return false
  return tournamentStore.matches.every(m => m.status === 'completed')
})

const leader = computed(() => {
  return tournamentStore.standings[0] ?? null
})

const tied = computed(() => {
  if (tournamentStore.standings.length < 2) return false
  return tournamentStore.standings[0].points === tournamentStore.standings[1].points
})

const tiedPlayers = computed(() => {
  if (!tied.value) return []
  return tournamentStore.standings.filter(row => row.points === leader.value.points)
})

const champion = computed(() => {
  const id = chosenWinnerId.value ?? (tied.value ? null : leader.value?.player_id)
  return id ? { id, name: playerName(id) } : null
})

const championReason = computed(() => {
  if (decidedBy.value === 'rps') return 'Ganó el piedra, papel o tijera'
  if (decidedBy.value === 'match') return 'Ganó el partido decisivo'
  return `${leader.value?.points ?? 0} pts`
})

const pendingExtras = computed(() =>
  tournamentStore.matches.filter(m => !m.turn_id && m.status !== 'completed'),
)

async function finish(addToHistory) {
  if (!champion.value) return
  await tournamentStore.finishTournament(champion.value.id, addToHistory)
  showFinish.value = false
  confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } })
}

async function startNext() {
  await tournamentStore.startNextRound()
}

// Disponible si el torneo todavía no se finalizó y hay al menos 2 jugadores
const canPlayAnotherRound = computed(() => {
  if (finished.value) return false
  return tournamentStore.tournamentPlayers.length >= 2
})

async function playAnotherRound() {
  showFinish.value = false
  await tournamentStore.startNextRound()
}

async function abort() {
  if (!confirm('¿Cortar la ronda actual? Los matches sin jugar quedarán incompletos.')) return
  await tournamentStore.abortRound()
}

function openEdit(matchId) {
  editMatchId.value = matchId
  editError.value = null
}

function closeEdit() {
  editMatchId.value = null
  editError.value = null
  editSaving.value = false
}

async function changeWinner(newWinnerId) {
  if (!editMatch.value) return
  if (editMatch.value.winner_id === newWinnerId) {
    closeEdit()
    return
  }
  // Si torneo ya finished y el cambio puede afectar al ganador → confirm doble
  if (finished.value) {
    const oldWinnerName = playerName(tournamentStore.tournament?.winner_player_id ?? '')
    const ok = confirm(
      `Este torneo ya está FINALIZADO. Cambiar este resultado podría modificar el campeón actual (${oldWinnerName}) y revertir el histórico. ¿Confirmás?`,
    )
    if (!ok) return
  }
  editSaving.value = true
  editError.value = null
  try {
    await tournamentStore.recordWinner(editMatch.value.id, newWinnerId)
    if (finished.value) await tournamentStore.resyncFinishedTournamentWinner()
    closeEdit()
  } catch (e) {
    editError.value = e.message
  } finally {
    editSaving.value = false
  }
}

async function markUnplayed() {
  if (!editMatch.value) return
  if (finished.value) {
    const ok = confirm(
      'Este torneo ya está FINALIZADO. Marcar este match como no jugado puede revertir el campeón. ¿Confirmás?',
    )
    if (!ok) return
  }
  editSaving.value = true
  editError.value = null
  try {
    await tournamentStore.unrecordWinner(editMatch.value.id)
    if (finished.value) await tournamentStore.resyncFinishedTournamentWinner()
    closeEdit()
  } catch (e) {
    editError.value = e.message
  } finally {
    editSaving.value = false
  }
}

const completedMatches = computed(() => {
  return [...tournamentStore.matches]
    .filter(m => m.status === 'completed')
    .sort((a, b) => {
      const ta = a.played_at ? new Date(a.played_at).getTime() : 0
      const tb = b.played_at ? new Date(b.played_at).getTime() : 0
      return tb - ta
    })
})

async function submitExtra() {
  if (!extraP1.value || !extraP2.value || extraP1.value === extraP2.value) return
  await tournamentStore.addExtraMatch(extraP1.value, extraP2.value, extraType.value)
  showExtra.value = false
  extraP1.value = ''
  extraP2.value = ''
}

const playerOptions = computed(() =>
  tournamentStore.players.map(p => ({ label: p.name, value: p.id })),
)

function isReady(match) {
  const busy = tournamentStore.busyPlayerIds
  return !busy.has(match.player1_id) && !busy.has(match.player2_id)
}

function waitingFor(match) {
  const busy = tournamentStore.busyPlayerIds
  return [match.player1_id, match.player2_id]
    .filter(pid => busy.has(pid))
    .map(playerName)
    .join(' y ')
}

const turnGame = computed(() => minigameForTurn(tournamentStore.currentTurn))

const nextRestingName = computed(() => {
  const pid = tournamentStore.nextTurn?.resting_player_id
  return pid ? playerName(pid) : null
})

const finished = computed(() => tournamentStore.tournament?.status === 'finished')
const currentTurnNumber = computed(() => tournamentStore.currentTurn?.turn_number ?? null)
</script>
