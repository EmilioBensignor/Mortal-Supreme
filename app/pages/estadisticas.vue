<template>
  <div class="flex flex-col gap-5">
    <h1 class="font-display text-ink text-3xl font-extrabold uppercase leading-none">Estadísticas</h1>

    <section
      v-if="!stats?.length"
      class="flex flex-col items-center gap-2 bg-surface border border-solid border-line rounded-xl text-center px-6 py-10"
    >
      <UIcon name="i-lucide-chart-bar" class="size-10 text-muted" />
      <p class="text-ink text-base font-semibold">Sin estadísticas todavía</p>
      <p class="text-muted text-sm">Aparecen cuando se juegan los primeros partidos</p>
    </section>

    <template v-else>
      <section class="flex flex-col gap-2">
        <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">Win rate</h2>
        <ul class="flex flex-col bg-surface border border-solid border-line rounded-xl px-4">
          <li v-for="row in stats" :key="row.player_id" class="flex flex-col gap-2 border-solid border-line not-first:border-t py-3">
            <div class="flex items-baseline justify-between gap-3">
              <span class="min-w-0 text-ink text-base font-semibold truncate">{{ row.name }}</span>
              <span class="shrink-0 font-display text-ink text-2xl font-extrabold leading-none tabular-nums">{{ Math.round(row.win_rate * 100) }}%</span>
            </div>
            <div class="w-full h-2 bg-sunken rounded-full overflow-hidden">
              <div
                class="h-full bg-accent rounded-full transition-all"
                :style="{ width: `${(row.win_rate / maxWinRate) * 100}%` }"
              />
            </div>
          </li>
        </ul>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">Trofeos</h2>
        <ul class="flex flex-col bg-surface border border-solid border-line rounded-xl px-4">
          <li v-for="row in stats" :key="row.player_id" class="flex flex-col gap-2 border-solid border-line not-first:border-t py-3">
            <div class="flex items-baseline justify-between gap-3">
              <span class="min-w-0 text-ink text-base font-semibold truncate">{{ row.name }}</span>
              <span class="flex shrink-0 items-center gap-1.5 font-display text-ink text-2xl font-extrabold leading-none tabular-nums">
                <UIcon name="i-lucide-trophy" class="size-4 text-accent" />
                {{ row.tournaments_won }}
              </span>
            </div>
            <div class="w-full h-2 bg-sunken rounded-full overflow-hidden">
              <div
                class="h-full bg-ink rounded-full transition-all"
                :style="{ width: `${(row.tournaments_won / maxTrophies) * 100}%` }"
              />
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const { data: stats } = await useAsyncData('stats-overview', async () => {
  const { data } = await supabase
    .from('v_player_stats')
    .select('*')
    .order('win_rate', { ascending: false })
  return data ?? []
})

const maxWinRate = computed(() => Math.max(...(stats.value ?? []).map(s => s.win_rate), 0.01))
const maxTrophies = computed(() => Math.max(...(stats.value ?? []).map(s => s.tournaments_won), 1))
</script>
