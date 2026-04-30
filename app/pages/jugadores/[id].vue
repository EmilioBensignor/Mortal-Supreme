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

<template>
  <div v-if="player" class="flex flex-col gap-5">
    <div>
      <NuxtLink to="/jugadores" class="text-pingpong-300 text-xs">← Jugadores</NuxtLink>
      <h1 class="text-light text-3xl font-bold">{{ player.name }}</h1>
    </div>

    <UCard v-if="stats">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-secondary text-3xl font-bold">{{ stats.tournaments_won }}</div>
          <div class="text-pingpong-300 text-xs uppercase tracking-wider">Torneos</div>
        </div>
        <div>
          <div class="text-light text-3xl font-bold">{{ stats.wins }}-{{ stats.losses }}</div>
          <div class="text-pingpong-300 text-xs uppercase tracking-wider">Matches</div>
        </div>
        <div>
          <div class="text-light text-3xl font-bold">{{ Math.round(stats.win_rate * 100) }}%</div>
          <div class="text-pingpong-300 text-xs uppercase tracking-wider">Win rate</div>
        </div>
      </div>
    </UCard>

    <section v-if="h2h && h2h.length > 0" class="flex flex-col gap-2">
      <h2 class="text-pingpong-200 text-sm uppercase tracking-wider">Head-to-head</h2>
      <UCard>
        <ul class="divide-y divide-pingpong-700/30">
          <li v-for="row in h2h" :key="row.name" class="flex justify-between py-2">
            <span class="text-light">{{ row.name }}</span>
            <span class="text-pingpong-200 text-sm">
              <span class="text-success font-bold">{{ row.wins }}</span> -
              <span class="text-error font-bold">{{ row.losses }}</span>
            </span>
          </li>
        </ul>
      </UCard>
    </section>

    <section v-if="tournaments && tournaments.length > 0" class="flex flex-col gap-2">
      <h2 class="text-pingpong-200 text-sm uppercase tracking-wider">Torneos jugados</h2>
      <UCard v-for="t in tournaments" :key="t.id">
        <NuxtLink :to="`/torneo/${t.id}`" class="flex items-center justify-between">
          <div>
            <div class="text-light font-semibold">
              {{ t.name }}
              <UIcon v-if="t.won" name="i-lucide-trophy" class="text-secondary ml-1" />
            </div>
            <div class="text-pingpong-300 text-xs">
              {{ new Date(t.created_at).toLocaleDateString('es-AR') }} — {{ t.status }}
            </div>
          </div>
          <UIcon name="i-lucide-chevron-right" class="text-pingpong-300" />
        </NuxtLink>
      </UCard>
    </section>
  </div>
</template>
