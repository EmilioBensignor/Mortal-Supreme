<script setup>
import confetti from 'canvas-confetti'

const route = useRoute()
const tournamentStore = useTournamentStore()
const id = route.params.id
await tournamentStore.load(id)

const showFinish = ref(false)
const showExtra = ref(false)
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
  await tournamentStore.recordWinner(matchId, winnerId)
  // Si todos los matches del torneo están listos, ofrecer finalización
  if (allMatchesDone.value) {
    showFinish.value = true
  }
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

async function finish(addToHistory) {
  if (!leader.value?.player) return
  await tournamentStore.finishTournament(leader.value.player.id, addToHistory)
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
      `⚠️ Este torneo ya está FINALIZADO. Cambiar este resultado podría modificar el campeón actual (${oldWinnerName}) y revertir el histórico. ¿Confirmás?`,
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
      '⚠️ Este torneo ya está FINALIZADO. Marcar este match como no jugado puede revertir el campeón. ¿Confirmás?',
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

const finished = computed(() => tournamentStore.tournament?.status === 'finished')
const currentTurnNumber = computed(() => tournamentStore.currentTurn?.turn_number ?? null)
</script>

<template>
  <div v-if="tournamentStore.tournament" class="flex flex-col gap-5 max-w-full overflow-x-hidden">
    <header class="flex flex-col gap-2">
      <NuxtLink to="/" class="flex items-center gap-1 text-pingpong-300 active:opacity-70 text-xs transition-opacity w-fit">
        <UIcon name="i-lucide-chevron-left" class="size-3" />
        Inicio
      </NuxtLink>
      <div class="flex items-center justify-between gap-2">
        <h1 class="text-light text-xl font-display font-bold leading-tight truncate">{{ tournamentStore.tournament.name }}</h1>
        <UBadge v-if="!finished" color="secondary" variant="subtle" class="shrink-0">
          Round {{ tournamentStore.currentRound?.round_number ?? '–' }}
        </UBadge>
        <UBadge v-else color="success" variant="subtle" class="shrink-0">Finalizado</UBadge>
      </div>
    </header>

    <!-- FINALIZADO -->
    <section v-if="finished && leader" class="flex flex-col items-center gap-3 bg-linear-to-br from-pelota-500/20 to-pingpong-700/30 rounded-2xl border border-solid border-pelota-500/40 px-6 py-7">
      <UIcon name="i-lucide-trophy" class="size-16 text-secondary" />
      <p class="text-pelota-200 text-xs uppercase tracking-wider font-semibold">Campeón</p>
      <h2 class="text-light text-3xl font-display font-bold text-center wrap-break-word">
        {{ playerName(tournamentStore.tournament.winner_player_id) }}
      </h2>
    </section>

    <!-- EN CURSO: jugando ahora -->
    <section v-if="!finished" class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 class="text-pingpong-200 text-xs font-semibold uppercase tracking-wider">Jugando ahora</h2>
        <span v-if="currentTurnNumber" class="font-mono-num text-light text-xs font-semibold">
          Turno {{ currentTurnNumber }}
        </span>
      </div>
      <div v-if="tournamentStore.currentTurnMatches.length === 0" class="bg-pingpong-900/40 rounded-2xl border border-solid border-pingpong-700/30 text-center text-pingpong-300 text-sm px-4 py-6">
        Round terminada. Generá la próxima abajo.
      </div>
      <article
        v-for="m in tournamentStore.currentTurnMatches"
        :key="m.id"
        class="flex flex-col gap-3 bg-pingpong-900/50 rounded-2xl border border-solid border-pingpong-700/40 p-4"
      >
        <div class="flex items-center justify-between text-pingpong-300 text-xs">
          <span class="flex items-center gap-1.5">
            <UIcon name="i-lucide-table-2" class="size-3.5" />
            Mesa <span class="font-mono-num font-bold text-pingpong-100">{{ m.table_number }}</span>
          </span>
          <div class="flex items-center gap-2">
            <span v-if="m.status === 'completed'" class="flex items-center gap-1 text-success text-xs font-semibold">
              <UIcon name="i-lucide-check" class="size-3.5" />
              Jugado
            </span>
            <button
              v-if="m.status === 'completed'"
              type="button"
              class="text-pingpong-300 active:opacity-70 transition-opacity p-1"
              aria-label="Editar resultado"
              @click="openEdit(m.id)"
            >
              <UIcon name="i-lucide-pencil" class="size-4" />
            </button>
          </div>
        </div>
        <div class="flex items-center justify-center gap-2">
          <button
            type="button"
            class="flex items-center justify-center gap-1.5 flex-1 min-w-0 min-h-14 rounded-xl border-2 border-solid transition-all duration-150 active:scale-[0.96] px-3 py-2.5"
            :class="m.winner_id === m.player1_id
              ? 'border-success bg-success/15 text-success'
              : m.winner_id
                ? 'border-pingpong-700/40 bg-pingpong-800/30 text-pingpong-400'
                : 'border-pingpong-600/50 bg-pingpong-700/20 text-light'"
            @click="recordWinner(m.id, m.player1_id)"
          >
            <UIcon
              v-if="m.winner_id === m.player1_id"
              name="i-lucide-crown"
              class="size-3.5 shrink-0"
            />
            <span class="text-sm font-semibold truncate">
              {{ playerName(m.player1_id) }}
            </span>
          </button>
          <span class="font-display text-pingpong-400 text-xs uppercase shrink-0 px-1">vs</span>
          <button
            type="button"
            class="flex items-center justify-center gap-1.5 flex-1 min-w-0 min-h-14 rounded-xl border-2 border-solid transition-all duration-150 active:scale-[0.96] px-3 py-2.5"
            :class="m.winner_id === m.player2_id
              ? 'border-success bg-success/15 text-success'
              : m.winner_id
                ? 'border-pingpong-700/40 bg-pingpong-800/30 text-pingpong-400'
                : 'border-pingpong-600/50 bg-pingpong-700/20 text-light'"
            @click="recordWinner(m.id, m.player2_id)"
          >
            <UIcon
              v-if="m.winner_id === m.player2_id"
              name="i-lucide-crown"
              class="size-3.5 shrink-0"
            />
            <span class="text-sm font-semibold truncate">
              {{ playerName(m.player2_id) }}
            </span>
          </button>
        </div>
      </article>
    </section>

    <!-- DESCANSANDO -->
    <section
      v-if="!finished && tournamentStore.restingPlayer"
      class="flex items-center gap-3 bg-pelota-500/10 border border-solid border-pelota-500/30 rounded-2xl px-4 py-3"
    >
      <UIcon name="i-lucide-coffee" class="size-8 text-pelota-400 shrink-0" />
      <div class="flex flex-col gap-0.5 min-w-0">
        <p class="text-pelota-200 text-xs uppercase tracking-wider font-semibold">Descansa</p>
        <p class="text-light text-base font-semibold truncate">{{ tournamentStore.restingPlayer.name }}</p>
        <p class="text-pelota-100/70 text-xs truncate">{{ restMessage }}</p>
      </div>
    </section>

    <!-- POSICIONES -->
    <section class="flex flex-col gap-2">
      <h2 class="text-pingpong-200 text-xs font-semibold uppercase tracking-wider">Posiciones</h2>
      <ul class="flex flex-col gap-1.5 bg-pingpong-900/40 rounded-2xl border border-solid border-pingpong-700/30 p-2">
        <li
          v-for="(row, i) in tournamentStore.standings"
          :key="row.player_id"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5"
          :class="i === 0 ? 'bg-[#ffd24a]/10 border border-solid border-[#ffd24a]/30' : ''"
        >
          <div
            class="size-7 flex items-center justify-center rounded-full font-mono-num text-xs font-bold shrink-0"
            :class="i === 0
              ? 'bg-[#ffd24a] text-pingpong-950'
              : i === 1
                ? 'bg-[#d3dce6] text-pingpong-950'
                : i === 2
                  ? 'bg-[#cd7f32] text-pingpong-950'
                  : 'bg-pingpong-800 text-pingpong-300'"
          >
            {{ i + 1 }}
          </div>
          <span class="flex-1 text-light text-sm font-semibold truncate">{{ row.player?.name ?? '?' }}</span>
          <div class="flex items-center gap-3 text-xs shrink-0">
            <span class="font-mono-num text-pingpong-300">{{ row.wins }}-{{ row.losses }}</span>
            <span class="font-mono-num text-secondary text-base font-bold w-6 text-right">{{ row.points }}</span>
          </div>
        </li>
      </ul>
    </section>

    <!-- MATCHES JUGADOS -->
    <section v-if="completedMatches.length > 0" class="flex flex-col gap-2">
      <details class="bg-pingpong-900/30 rounded-2xl border border-solid border-pingpong-700/30">
        <summary class="cursor-pointer flex items-center justify-between text-pingpong-200 text-xs font-semibold uppercase tracking-wider px-4 py-3 active:opacity-70 transition-opacity">
          Matches jugados <span class="font-mono-num text-pingpong-400">({{ completedMatches.length }})</span>
          <UIcon name="i-lucide-chevron-down" class="size-4" />
        </summary>
        <ul class="divide-y divide-pingpong-700/30">
          <li v-for="m in completedMatches" :key="m.id" class="flex items-center justify-between gap-2 px-4 py-2.5">
            <div class="flex flex-col gap-0.5 text-sm min-w-0">
              <div class="text-light truncate">
                <span :class="m.winner_id === m.player1_id ? 'text-success font-bold' : 'text-pingpong-300'">
                  {{ playerName(m.player1_id) }}
                </span>
                <span class="text-pingpong-400 mx-1">vs</span>
                <span :class="m.winner_id === m.player2_id ? 'text-success font-bold' : 'text-pingpong-300'">
                  {{ playerName(m.player2_id) }}
                </span>
              </div>
              <div class="font-mono-num text-pingpong-400 text-xs">
                <span v-if="m.match_type !== 'regular'" class="text-secondary uppercase mr-2 font-display">{{ m.match_type }}</span>
                <span v-if="m.played_at">{{ new Date(m.played_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) }}</span>
              </div>
            </div>
            <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-pencil" @click="openEdit(m.id)" />
          </li>
        </ul>
      </details>
    </section>

    <!-- ACCIONES -->
    <section v-if="!finished" class="flex flex-col gap-2 pt-2">
      <UButton
        v-if="tournamentStore.currentRound?.status === 'completed'"
        block
        color="primary"
        size="lg"
        icon="i-lucide-rotate-cw"
        @click="startNext"
      >
        Nueva round
      </UButton>
      <UButton
        block
        size="lg"
        color="secondary"
        icon="i-lucide-flag"
        :disabled="!leader"
        class="glow-secondary"
        @click="showFinish = true"
      >
        Finalizar torneo
      </UButton>
      <div class="grid grid-cols-2 gap-2">
        <UButton variant="outline" color="primary" icon="i-lucide-zap" @click="showExtra = true">
          Match extra
        </UButton>
        <UButton variant="outline" color="error" icon="i-lucide-x-circle" @click="abort">
          Cortar ronda
        </UButton>
      </div>
    </section>

    <!-- MODAL FINALIZAR -->
    <UModal :open="showFinish" @update:open="showFinish = $event">
      <template #content>
        <div v-if="leader?.player" class="flex flex-col gap-4 p-6">
          <h3 class="text-light text-lg font-bold">Finalizar torneo</h3>
          <p v-if="tied" class="text-warning text-sm">
            ⚠️ Hay empate en la cabecera. Considerá agregar un match de desempate antes de finalizar.
          </p>
          <p class="text-pingpong-200">
            Ganador: <strong class="text-secondary">{{ leader.player.name }}</strong>
            ({{ leader.points }} pts)
          </p>
          <div class="flex flex-col gap-2 mt-2">
            <UButton color="secondary" size="lg" block @click="finish(true)">
              Finalizar y sumar al histórico
            </UButton>
            <UButton variant="soft" color="neutral" block @click="finish(false)">
              Finalizar sin sumar al histórico
            </UButton>
            <UButton
              v-if="canPlayAnotherRound"
              variant="soft"
              color="primary"
              block
              icon="i-lucide-rotate-cw"
              @click="playAnotherRound"
            >
              Jugar otra ronda
            </UButton>
            <UButton variant="ghost" color="neutral" block @click="showFinish = false">Cancelar</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- MODAL MATCH EXTRA -->
    <UModal :open="showExtra" @update:open="showExtra = $event">
      <template #content>
        <div class="flex flex-col gap-3 p-6">
          <h3 class="text-light text-lg font-bold">Match extra / desempate</h3>
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
          <div class="flex justify-end gap-2 mt-2">
            <UButton variant="ghost" @click="showExtra = false">Cancelar</UButton>
            <UButton color="secondary" @click="submitExtra">Agregar</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- MODAL EDITAR RESULTADO -->
    <UModal :open="editMatch !== null" @update:open="(v) => !v && closeEdit()">
      <template #content>
        <div v-if="editMatch" class="flex flex-col gap-4 p-6">
          <h3 class="text-light text-lg font-bold">Editar resultado</h3>
          <p v-if="finished" class="text-warning text-sm">
            ⚠️ El torneo ya está finalizado. Cambios pueden afectar el campeón y el histórico.
          </p>
          <p class="text-pingpong-200 text-sm">
            Marcá quién ganó realmente este match, o marcalo como no jugado.
          </p>
          <div class="grid grid-cols-2 gap-2">
            <UButton
              block
              size="lg"
              :color="editMatch.winner_id === editMatch.player1_id ? 'success' : 'primary'"
              :variant="editMatch.winner_id === editMatch.player1_id ? 'solid' : 'soft'"
              :loading="editSaving"
              @click="changeWinner(editMatch.player1_id)"
            >
              {{ playerName(editMatch.player1_id) }}
            </UButton>
            <UButton
              block
              size="lg"
              :color="editMatch.winner_id === editMatch.player2_id ? 'success' : 'primary'"
              :variant="editMatch.winner_id === editMatch.player2_id ? 'solid' : 'soft'"
              :loading="editSaving"
              @click="changeWinner(editMatch.player2_id)"
            >
              {{ playerName(editMatch.player2_id) }}
            </UButton>
          </div>
          <p v-if="editError" class="text-error text-sm">{{ editError }}</p>
          <div class="flex flex-col gap-2 mt-2">
            <UButton variant="soft" color="warning" :loading="editSaving" @click="markUnplayed">
              Marcar como no jugado
            </UButton>
            <UButton variant="ghost" @click="closeEdit">Cancelar</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
