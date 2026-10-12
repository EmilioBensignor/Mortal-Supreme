<template>
  <div class="flex flex-col gap-5">
    <div class="flex items-center justify-between gap-3">
      <h1 class="font-display text-ink text-3xl font-extrabold uppercase leading-none">Torneos</h1>
      <UButton
        to="/nuevo-torneo"
        color="secondary"
        icon="i-lucide-plus"
        class="font-display font-bold uppercase tracking-wider"
      >
        Nuevo
      </UButton>
    </div>

    <!-- VACIO -->
    <section
      v-if="!tournaments?.length"
      class="flex flex-col items-center gap-2 bg-surface border border-solid border-line rounded-xl text-center px-6 py-10"
    >
      <UIcon name="i-lucide-swords" class="size-10 text-muted" />
      <p class="text-ink text-base font-semibold">Sin torneos todavía</p>
      <p class="text-muted text-sm">Creá el primero para arrancar</p>
    </section>

    <!-- EN CURSO -->
    <section v-if="inProgress.length > 0" class="flex flex-col gap-2">
      <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">En curso</h2>
      <ul class="flex flex-col gap-2">
        <li v-for="t in inProgress" :key="t.id">
          <NuxtLink
            :to="`/torneo/${t.id}`"
            class="flex items-center gap-3 bg-board rounded-xl text-board-fg transition-opacity active:opacity-90 p-4"
          >
            <TournamentLiveTag />
            <div class="flex flex-col flex-1 min-w-0">
              <span class="font-display text-lg font-bold uppercase tracking-wider truncate">{{ t.name }}</span>
              <span class="text-board-dim text-sm">{{ t.players_count }} jugadores · {{ formatDate(t.created_at) }}</span>
            </div>
            <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-board-dim" />
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- FINALIZADOS -->
    <section v-if="finished.length > 0" class="flex flex-col gap-2">
      <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">Finalizados</h2>
      <ul class="flex flex-col bg-surface border border-solid border-line rounded-xl px-4">
        <li v-for="t in finished" :key="t.id" class="border-solid border-line not-first:border-t">
          <NuxtLink
            :to="`/torneo/${t.id}`"
            class="flex items-center gap-3 transition-colors active:bg-sunken py-3"
          >
            <UIcon name="i-lucide-trophy" class="size-5 shrink-0 text-accent" />
            <div class="flex flex-col flex-1 min-w-0">
              <span class="text-ink text-base font-semibold truncate">{{ t.name }}</span>
              <span class="text-muted text-sm truncate">
                <strong v-if="t.winner_name" class="text-ink font-semibold">{{ t.winner_name }}</strong>
                <span v-else>Sin ganador</span>
                · {{ formatDate(t.finished_at ?? t.created_at) }}
                <template v-if="!t.counts_for_history"> · no cuenta</template>
              </span>
            </div>
            <span class="shrink-0 font-display text-muted text-sm font-bold tabular-nums">{{ t.players_count }}p</span>
            <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-muted" />
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- OTROS (abandonados / setup) -->
    <section v-if="others.length > 0" class="flex flex-col gap-2">
      <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">Otros</h2>
      <ul class="flex flex-col bg-surface border border-solid border-line rounded-xl px-4">
        <li v-for="t in others" :key="t.id" class="border-solid border-line not-first:border-t">
          <NuxtLink
            :to="`/torneo/${t.id}`"
            class="flex items-center gap-3 transition-colors active:bg-sunken py-3"
          >
            <UIcon name="i-lucide-circle-dashed" class="size-5 shrink-0 text-muted" />
            <div class="flex flex-col flex-1 min-w-0">
              <span class="text-ink text-base font-semibold truncate">{{ t.name }}</span>
              <span class="text-muted text-sm">{{ t.status }} · {{ formatDate(t.created_at) }}</span>
            </div>
            <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-muted" />
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>

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
