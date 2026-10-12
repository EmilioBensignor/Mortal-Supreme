<template>
  <div v-if="player" class="flex flex-col gap-5">
    <div class="flex flex-col gap-2">
      <NuxtLink to="/jugadores" class="flex items-center gap-1 text-muted text-sm active:opacity-70">
        <UIcon name="i-lucide-chevron-left" class="size-4" />
        Jugadores
      </NuxtLink>
      <h1 class="font-display text-ink text-6xl font-extrabold leading-none uppercase wrap-break-word">{{ player.name }}</h1>
    </div>

    <div v-if="stats" class="grid grid-cols-3 bg-surface border border-solid border-line rounded-xl text-center">
      <div class="flex flex-col px-2 py-4">
        <span class="font-display text-accent text-4xl font-extrabold leading-none tabular-nums">{{ stats.tournaments_won }}</span>
        <span class="font-display text-muted text-sm font-bold uppercase tracking-widest mt-1">Torneos</span>
      </div>
      <div class="flex flex-col border-solid border-line not-first:border-l px-2 py-4">
        <span class="font-display text-ink text-4xl font-extrabold leading-none tabular-nums">{{ stats.wins }}-{{ stats.losses }}</span>
        <span class="font-display text-muted text-sm font-bold uppercase tracking-widest mt-1">Matches</span>
      </div>
      <div class="flex flex-col border-solid border-line not-first:border-l px-2 py-4">
        <span class="font-display text-ink text-4xl font-extrabold leading-none tabular-nums">{{ Math.round(stats.win_rate * 100) }}%</span>
        <span class="font-display text-muted text-sm font-bold uppercase tracking-widest mt-1">Win rate</span>
      </div>
    </div>

    <section v-if="h2h && h2h.length > 0" class="flex flex-col gap-2">
      <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">Head-to-head</h2>
      <ul class="flex flex-col bg-surface border border-solid border-line rounded-xl px-4">
        <li v-for="row in h2h" :key="row.name" class="flex items-center justify-between gap-3 border-solid border-line not-first:border-t py-3">
          <span class="min-w-0 text-ink text-base font-semibold truncate">{{ row.name }}</span>
          <span class="shrink-0 font-display text-xl font-extrabold tabular-nums">
            <span class="text-win">{{ row.wins }}</span>
            <span class="text-muted"> - </span>
            <span class="text-loss">{{ row.losses }}</span>
          </span>
        </li>
      </ul>
    </section>

    <section v-if="tournaments && tournaments.length > 0" class="flex flex-col gap-2">
      <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">Torneos jugados</h2>
      <ul class="flex flex-col bg-surface border border-solid border-line rounded-xl px-4">
        <li v-for="t in tournaments" :key="t.id" class="border-solid border-line not-first:border-t">
          <NuxtLink :to="`/torneo/${t.id}`" class="flex items-center gap-3 transition-colors active:bg-sunken py-3">
            <div class="flex flex-col flex-1 min-w-0">
              <span class="flex items-center gap-1.5 text-ink text-base font-semibold">
                <span class="truncate">{{ t.name }}</span>
                <UIcon v-if="t.won" name="i-lucide-trophy" class="size-4 shrink-0 text-accent" />
              </span>
              <span class="text-muted text-sm">{{ new Date(t.created_at).toLocaleDateString('es-AR') }} · {{ t.status }}</span>
            </div>
            <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-muted" />
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
const route = useRoute()
const supabase = useSupabaseClient()
const id = route.params.id

const { data: player } = await useAsyncData(`player-${id}`, async () => {
  const { data } = await supabase.from('players').select('*').eq('id', id).single()
  return data ?? null
})

const { data: stats } = await useAsyncData(`player-stats-${id}`, async () => {
  const { data } = await supabase.from('v_player_stats').select('*').eq('player_id', id).maybeSingle()
  return data ?? null
})

const { data: tournaments } = await useAsyncData(`player-tournaments-${id}`, async () => {
  const { data: tps } = await supabase
    .from('tournament_players')
    .select('tournament_id, points, wins, losses')
    .eq('player_id', id)
  if (!tps?.length) return []
  const ids = tps.map(tp => tp.tournament_id)
  const { data: ts } = await supabase
    .from('tournaments')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false })
  return (ts ?? []).map(t => ({
    ...t,
    won: t.winner_player_id === id,
  }))
})

const { data: h2h } = await useAsyncData(`h2h-${id}`, async () => {
  const { data: ms } = await supabase
    .from('matches')
    .select('player1_id,player2_id,winner_id,status')
    .eq('status', 'completed')
    .or(`player1_id.eq.${id},player2_id.eq.${id}`)
  const counts = {}
  for (const m of ms ?? []) {
    const opp = m.player1_id === id ? m.player2_id : m.player1_id
    counts[opp] ||= { wins: 0, losses: 0 }
    if (m.winner_id === id) counts[opp].wins++
    else if (m.winner_id) counts[opp].losses++
  }
  if (Object.keys(counts).length === 0) return []
  const { data: ps } = await supabase
    .from('players')
    .select('id,name')
    .in('id', Object.keys(counts))
  return (ps ?? []).map(p => ({
    name: p.name,
    wins: counts[p.id].wins,
    losses: counts[p.id].losses,
  }))
})
</script>
