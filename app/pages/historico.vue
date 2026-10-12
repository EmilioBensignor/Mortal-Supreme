<template>
  <div class="flex flex-col gap-5">
    <h1 class="font-display text-ink text-3xl font-extrabold uppercase leading-none">Histórico</h1>

    <!-- RANKING -->
    <section v-if="stats?.length" class="flex flex-col gap-2">
      <div class="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-3 font-display text-muted text-sm font-bold uppercase tracking-widest px-4">
        <span>#</span>
        <span>Jugador</span>
        <span class="text-right">W-L</span>
        <span class="w-10 text-right">Títulos</span>
      </div>
      <ol class="flex flex-col bg-surface border border-solid border-line rounded-xl px-4">
        <li v-for="(p, i) in stats" :key="p.player_id" class="border-solid border-line not-first:border-t">
          <NuxtLink
            :to="`/jugadores/${p.player_id}`"
            class="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-3 transition-colors active:bg-sunken py-3"
          >
            <span
              class="size-8 flex items-center justify-center rounded-full font-display text-base font-extrabold tabular-nums"
              :class="[
                i === 0 ? 'bg-gold text-ink' : '',
                i === 1 ? 'bg-silver text-ink' : '',
                i === 2 ? 'bg-bronze text-ink' : '',
                i > 2 ? 'bg-sunken text-muted' : '',
              ]"
            >{{ i + 1 }}</span>
            <span class="flex flex-col min-w-0">
              <span class="text-ink text-base font-semibold truncate">{{ p.name }}</span>
              <span class="text-muted text-sm tabular-nums">{{ Math.round(p.win_rate * 100) }}% win rate</span>
            </span>
            <span class="font-display text-muted text-lg font-bold tabular-nums">{{ p.wins }}-{{ p.losses }}</span>
            <span class="w-10 font-display text-ink text-3xl font-extrabold leading-none text-right tabular-nums">{{ p.tournaments_won }}</span>
          </NuxtLink>
        </li>
      </ol>
    </section>

    <!-- VACIO -->
    <section
      v-else
      class="flex flex-col items-center gap-2 bg-surface border border-solid border-line rounded-xl text-center px-6 py-10"
    >
      <UIcon name="i-lucide-trophy" class="size-10 text-muted" />
      <p class="text-ink text-base font-semibold">Sin torneos finalizados aún</p>
      <p class="text-muted text-sm">Jugá tu primer torneo para empezar el ranking</p>
    </section>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const { data: stats } = await useAsyncData('player-stats', async () => {
  const { data } = await supabase
    .from('v_player_stats')
    .select('*')
    .order('tournaments_won', { ascending: false })
    .order('wins', { ascending: false })
  return data ?? []
})

const podium = computed(() => {
  const list = stats.value ?? []
  return list.slice(0, 3)
})
const rest = computed(() => (stats.value ?? []).slice(3))
</script>
