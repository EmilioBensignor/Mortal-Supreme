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

<template>
  <div class="flex flex-col gap-5">
    <header class="flex items-center justify-between">
      <h1 class="text-light text-2xl font-bold">Nuevo torneo</h1>
      <span class="text-pingpong-300 text-sm">Paso {{ step }} / 3</span>
    </header>

    <!-- PASO 1 -->
    <section v-if="step === 1" class="flex flex-col gap-4">
      <UCard>
        <div class="flex flex-col gap-3">
          <label class="text-pingpong-200 text-sm">Formato</label>
          <URadioGroup
            v-model="format"
            :items="[
              { label: 'Liga (puntos por victoria)', value: 'league' },
              { label: 'Lightning (rápido, sin histórico)', value: 'lightning' },
            ]"
          />

          <label class="text-pingpong-200 text-sm mt-2">Puntos por partido (target score)</label>
          <UInput v-model.number="targetScore" type="number" :min="1" />

          <label class="text-pingpong-200 text-sm mt-2">Cantidad de mesas</label>
          <UInput v-model.number="tablesCount" type="number" :min="1" :max="8" />

          <UCheckbox v-model="countsForHistory" label="Cuenta para el ranking histórico" />
        </div>
      </UCard>
      <UButton color="secondary" block size="lg" @click="step = 2">Siguiente</UButton>
    </section>

    <!-- PASO 2 -->
    <section v-if="step === 2" class="flex flex-col gap-4">
      <UCard>
        <p class="text-pingpong-200 text-sm mb-2">Seleccionar jugadores ({{ selectedIds.length }})</p>
        <ul class="grid grid-cols-2 gap-2">
          <li v-for="p in playersStore.active" :key="p.id">
            <button
              type="button"
              class="w-full bg-pingpong-700/30 hover:bg-pingpong-600/40 border border-solid rounded-xl text-light text-sm font-semibold transition-colors px-3 py-2"
              :class="selectedIds.includes(p.id) ? 'border-secondary bg-pingpong-600/50' : 'border-transparent'"
              @click="toggle(p.id)"
            >
              {{ p.name }}
            </button>
          </li>
        </ul>

        <div class="flex gap-2 mt-4">
          <UInput v-model="newPlayerName" placeholder="Crear nuevo…" class="flex-1" @keyup.enter="quickCreatePlayer" />
          <UButton icon="i-lucide-plus" @click="quickCreatePlayer" />
        </div>
        <p v-if="error" class="text-error text-sm mt-2">{{ error }}</p>
      </UCard>
      <div class="flex gap-2">
        <UButton variant="ghost" block @click="step = 1">Atrás</UButton>
        <UButton color="secondary" block :disabled="selectedIds.length < 2" @click="step = 3">
          Siguiente
        </UButton>
      </div>
    </section>

    <!-- PASO 3 -->
    <section v-if="step === 3" class="flex flex-col gap-4">
      <UCard>
        <div class="flex flex-col gap-3">
          <label class="text-pingpong-200 text-sm">Nombre del torneo (opcional)</label>
          <UInput v-model="tournamentName" placeholder="Auto: Torneo del DD/MM" />
        </div>
        <div class="grid grid-cols-3 gap-3 text-center mt-5">
          <div>
            <div class="text-light text-2xl font-bold">{{ selectedIds.length }}</div>
            <div class="text-pingpong-300 text-xs">Jugadores</div>
          </div>
          <div>
            <div class="text-light text-2xl font-bold">{{ totalMatches }}</div>
            <div class="text-pingpong-300 text-xs">Matches</div>
          </div>
          <div>
            <div class="text-light text-2xl font-bold">~{{ estimatedTurns }}</div>
            <div class="text-pingpong-300 text-xs">Turns</div>
          </div>
        </div>
        <p v-if="error" class="text-error text-sm mt-3">{{ error }}</p>
      </UCard>
      <div class="flex gap-2">
        <UButton variant="ghost" block @click="step = 2">Atrás</UButton>
        <UButton color="secondary" block size="lg" :loading="creating" @click="confirm">
          ¡Empezar!
        </UButton>
      </div>
    </section>
  </div>
</template>
