<script setup>
const supabase = useSupabaseClient()

const { data: tournaments } = await useAsyncData('all-tournaments', async () => {
  const { data: ts } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })
  if (!ts?.length) return []

  // Hidratar nombre del ganador para los finalizados
  const winnerIds = [...new Set(ts.map(t => t.winner_player_id).filter(Boolean))]
  const namesById = {}
  if (winnerIds.length > 0) {
    const { data: ps } = await supabase
      .from('players')
      .select('id, name')
      .in('id', winnerIds)
    for (const p of ps ?? []) namesById[p.id] = p.name
  }

  // Contar jugadores por torneo
  const { data: tps } = await supabase
    .from('tournament_players')
    .select('tournament_id, player_id')
    .in('tournament_id', ts.map(t => t.id))
  const countByT = {}
  for (const tp of tps ?? []) {
    countByT[tp.tournament_id] = (countByT[tp.tournament_id] ?? 0) + 1
  }

  return ts.map(t => ({
    ...t,
    winner_name: t.winner_player_id ? (namesById[t.winner_player_id] ?? null) : null,
    players_count: countByT[t.id] ?? 0,
  }))
})

const inProgress = computed(() =>
  (tournaments.value ?? []).filter(t => t.status === 'in_progress'),
)
const finished = computed(() =>
  (tournaments.value ?? []).filter(t => t.status === 'finished'),
)
const others = computed(() =>
  (tournaments.value ?? []).filter(t => t.status !== 'in_progress' && t.status !== 'finished'),
)

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-light text-2xl font-display font-bold">Torneos</h1>
      <UButton
        to="/nuevo-torneo"
        size="sm"
        color="secondary"
        icon="i-lucide-plus"
      >
        Nuevo
      </UButton>
    </div>

    <!-- VACIO -->
    <section
      v-if="!tournaments?.length"
      class="flex flex-col items-center gap-2 bg-pingpong-900/40 rounded-2xl border border-solid border-pingpong-700/30 text-center px-6 py-10"
    >
      <UIcon name="i-lucide-swords" class="size-10 text-pingpong-500" />
      <p class="text-pingpong-200 text-sm">Sin torneos todavía</p>
      <p class="text-pingpong-400 text-xs">Creá el primero para arrancar</p>
    </section>

    <!-- EN CURSO -->
    <section v-if="inProgress.length > 0" class="flex flex-col gap-2">
      <h2 class="text-pingpong-200 text-xs font-semibold uppercase tracking-wider">En curso</h2>
      <ul class="flex flex-col gap-2">
        <li v-for="t in inProgress" :key="t.id">
          <NuxtLink
            :to="`/torneo/${t.id}`"
            class="flex items-center gap-3 bg-secondary/10 rounded-2xl border border-solid border-secondary/30 active:opacity-70 transition-opacity px-4 py-3"
          >
            <UIcon name="i-lucide-play" class="size-5 text-secondary shrink-0" />
            <div class="flex flex-col gap-0.5 flex-1 min-w-0">
              <span class="text-light text-sm font-semibold truncate">{{ t.name }}</span>
              <span class="text-pingpong-300 text-xs">
                {{ t.players_count }} jugadores · {{ formatDate(t.created_at) }}
              </span>
            </div>
            <UIcon name="i-lucide-chevron-right" class="size-4 text-pingpong-300 shrink-0" />
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- FINALIZADOS -->
    <section v-if="finished.length > 0" class="flex flex-col gap-2">
      <h2 class="text-pingpong-200 text-xs font-semibold uppercase tracking-wider">Finalizados</h2>
      <ul class="flex flex-col gap-1.5 bg-pingpong-900/40 rounded-2xl border border-solid border-pingpong-700/30 p-2">
        <li v-for="t in finished" :key="t.id">
          <NuxtLink
            :to="`/torneo/${t.id}`"
            class="flex items-center gap-3 rounded-xl active:bg-pingpong-700/40 transition-colors px-3 py-2.5"
          >
            <UIcon name="i-lucide-trophy" class="size-4 text-secondary shrink-0" />
            <div class="flex flex-col gap-0.5 flex-1 min-w-0">
              <span class="text-light text-sm font-semibold truncate">{{ t.name }}</span>
              <span class="text-pingpong-300 text-xs truncate">
                <span v-if="t.winner_name" class="text-secondary font-semibold">{{ t.winner_name }}</span>
                <span v-else class="italic">sin ganador</span>
                <span class="text-pingpong-400"> · {{ formatDate(t.finished_at ?? t.created_at) }}</span>
                <span v-if="!t.counts_for_history" class="text-pingpong-400"> · no cuenta</span>
              </span>
            </div>
            <span class="font-mono-num text-pingpong-400 text-xs shrink-0">{{ t.players_count }}p</span>
            <UIcon name="i-lucide-chevron-right" class="size-4 text-pingpong-400 shrink-0" />
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- OTROS (abandonados / setup) -->
    <section v-if="others.length > 0" class="flex flex-col gap-2">
      <h2 class="text-pingpong-200 text-xs font-semibold uppercase tracking-wider">Otros</h2>
      <ul class="flex flex-col gap-1.5 bg-pingpong-900/30 rounded-2xl border border-solid border-pingpong-700/20 p-2">
        <li v-for="t in others" :key="t.id">
          <NuxtLink
            :to="`/torneo/${t.id}`"
            class="flex items-center gap-3 rounded-xl active:bg-pingpong-700/40 transition-colors px-3 py-2.5"
          >
            <UIcon name="i-lucide-circle-dashed" class="size-4 text-pingpong-400 shrink-0" />
            <div class="flex flex-col gap-0.5 flex-1 min-w-0">
              <span class="text-pingpong-200 text-sm truncate">{{ t.name }}</span>
              <span class="text-pingpong-400 text-xs">
                {{ t.status }} · {{ formatDate(t.created_at) }}
              </span>
            </div>
            <UIcon name="i-lucide-chevron-right" class="size-4 text-pingpong-400 shrink-0" />
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
