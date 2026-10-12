<template>
  <div class="flex flex-col gap-5">
    <h1 class="text-center font-display text-ink text-4xl font-extrabold leading-none uppercase whitespace-nowrap pt-1">Mortal Supreme</h1>

    <div class="w-full flex flex-col gap-2.5">
      <UButton
        v-if="activeTournament"
        :to="`/torneo/${activeTournament.id}`"
        color="secondary"
        block
        size="xl"
        icon="i-lucide-play"
        class="min-h-13 font-display text-base font-bold uppercase tracking-wider"
      >
        Continuar torneo
      </UButton>
      <UButton
        to="/nuevo-torneo"
        :color="activeTournament ? 'neutral' : 'secondary'"
        :variant="activeTournament ? 'outline' : 'solid'"
        block
        size="xl"
        :icon="activeTournament ? 'i-lucide-plus' : 'i-lucide-swords'"
        class="min-h-13 font-display text-base font-bold uppercase tracking-wider"
        :class="activeTournament ? 'bg-surface ring-2 ring-ink text-ink' : ''"
      >
        {{ activeTournament ? 'Crear otro torneo' : 'Crear torneo' }}
      </UButton>
    </div>

    <NuxtLink
      v-if="live"
      :to="`/torneo/${live.id}`"
      class="flex flex-col bg-surface border border-solid border-line rounded-xl transition-colors active:bg-sunken overflow-hidden"
    >
      <div class="flex items-center justify-between gap-3 px-4 pt-4">
        <TournamentLiveTag />
        <span v-if="tournamentStore.currentTurn" class="font-display text-muted text-xs font-bold uppercase tracking-widest tabular-nums">
          Ronda {{ tournamentStore.currentRound?.round_number }} · Turno {{ tournamentStore.currentTurn.turn_number }}
        </span>
      </div>
      <p class="font-display text-ink text-2xl font-extrabold leading-tight uppercase truncate px-4 pt-2 pb-3">{{ live.name }}</p>
      <ul v-if="tournamentStore.currentTurnMatches.length > 0" class="flex flex-col gap-2.5 px-4 pb-4">
        <li
          v-for="m in tournamentStore.currentTurnMatches"
          :key="m.id"
          class="mesa flex flex-col gap-1.5 px-3 pt-2 pb-3"
        >
          <span class="relative self-center bg-mesa-600 font-display text-mesa-100 text-xs font-bold uppercase tracking-widest px-2">Mesa {{ m.table_number }}</span>
          <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <span class="flex items-center justify-end gap-1.5 min-w-0 font-display text-xl font-bold uppercase" :class="sideClass(m, m.player1_id)">
              <UIcon v-if="m.winner_id === m.player1_id" name="i-lucide-crown" class="size-4 shrink-0" />
              <span class="truncate">{{ playerName(m.player1_id) }}</span>
            </span>
            <span class="relative bg-mesa-600 font-display text-mesa-100 text-xs font-bold uppercase py-1">vs</span>
            <span class="flex items-center gap-1.5 min-w-0 font-display text-xl font-bold uppercase" :class="sideClass(m, m.player2_id)">
              <span class="truncate">{{ playerName(m.player2_id) }}</span>
              <UIcon v-if="m.winner_id === m.player2_id" name="i-lucide-crown" class="size-4 shrink-0" />
            </span>
          </div>
        </li>
      </ul>
      <p v-else class="border-t border-solid border-line text-muted text-sm px-4 py-3">Round terminada, falta generar la próxima.</p>
      <div v-if="leader || tournamentStore.restingPlayer" class="grid grid-cols-2 border-t border-solid border-line">
        <div class="flex flex-col gap-0.5 min-w-0 px-4 py-3">
          <span class="font-display text-muted text-xs font-bold uppercase tracking-widest">Puntero</span>
          <span v-if="leader" class="text-ink font-semibold truncate">{{ leader.player?.name }} · <span class="tabular-nums">{{ leader.points }}</span> pts</span>
        </div>
        <div class="flex flex-col gap-0.5 min-w-0 border-l border-solid border-line px-4 py-3">
          <span class="font-display text-muted text-xs font-bold uppercase tracking-widest">Descansa</span>
          <span class="text-ink font-semibold truncate">{{ tournamentStore.restingPlayer?.name ?? 'Nadie' }}</span>
        </div>
      </div>
    </NuxtLink>

    <NuxtLink
      v-if="home?.champion"
      :to="`/torneo/${home.champion.id}`"
      class="flex items-center justify-between gap-3 bg-surface border border-solid border-line rounded-xl transition-colors active:bg-sunken p-4"
    >
      <div class="flex flex-col min-w-0">
        <p class="text-muted text-sm">Último campeón</p>
        <p class="font-display text-ink text-3xl font-extrabold leading-none uppercase truncate">{{ home.champion.winner?.name ?? '?' }}</p>
        <p class="text-muted text-sm truncate mt-1">{{ home.champion.name }}</p>
      </div>
      <UIcon name="i-lucide-trophy" class="size-9 shrink-0 text-accent" />
    </NuxtLink>

    <section v-if="home?.podium.length" class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">Ranking histórico</h2>
        <NuxtLink to="/historico" class="font-display text-accent text-sm font-bold uppercase tracking-wider active:opacity-70">Ver todo</NuxtLink>
      </div>
      <ol class="flex flex-col bg-surface border border-solid border-line rounded-xl px-4">
        <li
          v-for="(row, i) in home.podium"
          :key="row.player_id"
          class="grid grid-cols-[2rem_1fr_auto] items-center border-solid border-line not-first:border-t py-3"
        >
          <span class="font-display text-xl font-extrabold" :class="i === 0 ? 'text-accent' : 'text-muted'">{{ i + 1 }}</span>
          <span class="min-w-0 text-ink text-base font-semibold truncate">{{ row.name }}</span>
          <span class="font-display text-ink text-2xl font-extrabold tabular-nums">{{ row.tournaments_won }}</span>
        </li>
      </ol>
    </section>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const tournamentStore = useTournamentStore()
const { activeTournament, refresh } = useActiveTournament()

await refresh()
if (activeTournament.value) await tournamentStore.load(activeTournament.value.id)

const { data: home } = await useAsyncData('home', async () => {
  const [{ data: champion }, { data: podium }] = await Promise.all([
    supabase
      .from('tournaments')
      .select('id, name, winner:players!winner_player_id(name)')
      .eq('status', 'finished')
      .not('winner_player_id', 'is', null)
      .order('finished_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('v_player_stats')
      .select('player_id, name, tournaments_won')
      .gt('tournaments_won', 0)
      .order('tournaments_won', { ascending: false })
      .limit(3),
  ])
  return { champion, podium: podium ?? [] }
})

const live = computed(() => {
  if (!activeTournament.value) return null
  return tournamentStore.tournament?.id === activeTournament.value.id ? activeTournament.value : null
})

const leader = computed(() => tournamentStore.standings[0] ?? null)

function sideClass(match, pid) {
  if (!match.winner_id || match.winner_id === pid) return 'text-white'
  return 'text-mesa-200'
}

function playerName(pid) {
  return tournamentStore.players.find(p => p.id === pid)?.name ?? '?'
}
</script>
