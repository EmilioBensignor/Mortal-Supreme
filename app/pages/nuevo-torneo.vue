<template>
  <div class="flex flex-col gap-5">
    <header class="flex items-end justify-between gap-3">
      <h1 class="font-display text-ink text-3xl font-extrabold uppercase leading-none">Nuevo torneo</h1>
      <span class="font-display text-muted text-sm font-bold uppercase tracking-widest tabular-nums">Paso {{ step }} / 3</span>
    </header>

    <!-- PASO 1 -->
    <section v-if="step === 1" class="flex flex-col gap-4">
      <div class="flex flex-col gap-3 bg-surface border border-solid border-line rounded-xl p-4">
        <label class="font-display text-muted text-sm font-bold uppercase tracking-widest">Formato</label>
        <URadioGroup
          v-model="format"
          color="secondary"
          :items="[
            { label: 'Liga (puntos por victoria)', value: 'league' },
            { label: 'Lightning (rápido, sin histórico)', value: 'lightning' },
          ]"
        />

        <label class="font-display text-muted text-sm font-bold uppercase tracking-widest mt-2">Puntos por partido</label>
        <UInput v-model.number="targetScore" type="number" :min="1" size="lg" />

        <label class="font-display text-muted text-sm font-bold uppercase tracking-widest mt-2">Cantidad de mesas</label>
        <UInput v-model.number="tablesCount" type="number" :min="1" :max="8" size="lg" />

        <UCheckbox v-model="countsForHistory" color="secondary" label="Cuenta para el ranking histórico" class="mt-2" />
      </div>
      <UButton
        color="secondary"
        block
        size="xl"
        class="min-h-13 font-display text-base font-bold uppercase tracking-wider"
        @click="step = 2"
      >
        Siguiente
      </UButton>
    </section>

    <!-- PASO 2 -->
    <section v-if="step === 2" class="flex flex-col gap-4">
      <div class="flex flex-col gap-3 bg-surface border border-solid border-line rounded-xl p-4">
        <p class="font-display text-muted text-sm font-bold uppercase tracking-widest">Jugadores ({{ selectedIds.length }})</p>
        <ul class="flex flex-wrap gap-2">
          <li v-for="p in playersStore.active" :key="p.id" class="max-w-full">
            <button
              type="button"
              class="max-w-full min-h-11 border border-solid rounded-full text-base font-semibold truncate transition-colors px-4"
              :class="selectedIds.includes(p.id) ? 'bg-ink border-ink text-white' : 'bg-surface border-line text-ink'"
              @click="toggle(p.id)"
            >
              {{ p.name }}
            </button>
          </li>
        </ul>

        <div class="flex gap-2 border-t border-solid border-line pt-3">
          <UInput v-model="newPlayerName" placeholder="Crear nuevo…" class="flex-1 min-w-0" @keyup.enter="quickCreatePlayer" />
          <UButton icon="i-lucide-plus" color="neutral" variant="outline" @click="quickCreatePlayer" />
        </div>
        <p v-if="error" class="text-error text-sm">{{ error }}</p>
      </div>
      <div class="flex gap-2">
        <UButton color="neutral" variant="outline" block size="lg" @click="step = 1">Atrás</UButton>
        <UButton color="secondary" block size="lg" :disabled="selectedIds.length < 2" @click="step = 3">
          Siguiente
        </UButton>
      </div>
    </section>

    <!-- PASO 3 -->
    <section v-if="step === 3" class="flex flex-col gap-4">
      <div class="flex flex-col gap-5 bg-surface border border-solid border-line rounded-xl p-4">
        <div class="flex flex-col gap-3">
          <label class="font-display text-muted text-sm font-bold uppercase tracking-widest">Nombre del torneo (opcional)</label>
          <UInput v-model="tournamentName" placeholder="Auto: Torneo del DD/MM" size="lg" />
        </div>
        <div class="grid grid-cols-3 bg-sunken rounded-xl text-center">
          <div class="flex flex-col px-2 py-3">
            <span class="font-display text-ink text-3xl font-extrabold leading-none tabular-nums">{{ selectedIds.length }}</span>
            <span class="font-display text-muted text-sm font-bold uppercase tracking-widest mt-1">Jugadores</span>
          </div>
          <div class="flex flex-col border-solid border-line not-first:border-l px-2 py-3">
            <span class="font-display text-ink text-3xl font-extrabold leading-none tabular-nums">{{ totalMatches }}</span>
            <span class="font-display text-muted text-sm font-bold uppercase tracking-widest mt-1">Matches</span>
          </div>
          <div class="flex flex-col border-solid border-line not-first:border-l px-2 py-3">
            <span class="font-display text-ink text-3xl font-extrabold leading-none tabular-nums">~{{ estimatedTurns }}</span>
            <span class="font-display text-muted text-sm font-bold uppercase tracking-widest mt-1">Turns</span>
          </div>
        </div>
        <p v-if="error" class="text-error text-sm">{{ error }}</p>
      </div>
      <div class="flex gap-2">
        <UButton color="neutral" variant="outline" size="xl" class="min-h-13" @click="step = 2">Atrás</UButton>
        <UButton
          color="secondary"
          block
          size="xl"
          :loading="creating"
          class="min-h-13 font-display text-base font-bold uppercase tracking-wider"
          @click="confirm"
        >
          ¡Empezar!
        </UButton>
      </div>
    </section>
  </div>
</template>

<script setup>
import { expectedMatches } from '~/utils/scheduler'

const playersStore = usePlayersStore()
const tournamentStore = useTournamentStore()
await playersStore.fetchAll()

const step = ref(1)
const format = ref('league')
const targetScore = ref(21)
const tablesCount = ref(2)
const countsForHistory = ref(true)
const selectedIds = ref([])
const tournamentName = ref('')
const newPlayerName = ref('')
const creating = ref(false)
const error = ref(null)

watch(format, (f) => {
  targetScore.value = f === 'lightning' ? 11 : 21
  countsForHistory.value = f === 'league'
})

const totalMatches = computed(() => expectedMatches(selectedIds.value.length))
const estimatedTurns = computed(() => {
  const n = selectedIds.value.length
  const t = tablesCount.value
  if (n < 2) return 0
  return Math.ceil(totalMatches.value / Math.min(t, Math.floor(n / 2) || 1))
})

function toggle(id) {
  const i = selectedIds.value.indexOf(id)
  if (i >= 0) selectedIds.value.splice(i, 1)
  else selectedIds.value.push(id)
}

async function quickCreatePlayer() {
  if (!newPlayerName.value.trim()) return
  try {
    const p = await playersStore.create(newPlayerName.value)
    selectedIds.value.push(p.id)
    newPlayerName.value = ''
  } catch (e) {
    error.value = e.message
  }
}

async function confirm() {
  if (selectedIds.value.length < 2) {
    error.value = 'Necesitás al menos 2 jugadores'
    return
  }
  creating.value = true
  error.value = null
  try {
    const name = tournamentName.value.trim() || `Torneo del ${new Date().toLocaleDateString('es-AR')}`
    const id = await tournamentStore.createTournament({
      name,
      format: format.value,
      targetScore: targetScore.value,
      tablesCount: tablesCount.value,
      countsForHistory: countsForHistory.value,
      playerIds: selectedIds.value,
    })
    await navigateTo(`/torneo/${id}`)
  } catch (e) {
    error.value = e.message
  } finally {
    creating.value = false
  }
}
</script>
