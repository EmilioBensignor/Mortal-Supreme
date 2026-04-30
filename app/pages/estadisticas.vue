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

<template>
  <div class="flex flex-col gap-5">
    <h1 class="text-light text-2xl font-bold">Estadísticas</h1>

    <section class="flex flex-col gap-2">
      <h2 class="text-pingpong-200 text-sm uppercase tracking-wider">Win rate</h2>
      <UCard>
        <ul class="flex flex-col gap-3">
          <li v-for="row in stats" :key="row.player_id" class="flex flex-col gap-1">
            <div class="flex justify-between text-sm">
              <span class="text-light">{{ row.name }}</span>
              <span class="text-pingpong-200">{{ Math.round(row.win_rate * 100) }}%</span>
            </div>
            <div class="w-full h-2 bg-pingpong-900 rounded-full overflow-hidden">
              <div
                class="h-full bg-secondary rounded-full transition-all"
                :style="{ width: `${(row.win_rate / maxWinRate) * 100}%` }"
              />
            </div>
          </li>
        </ul>
      </UCard>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="text-pingpong-200 text-sm uppercase tracking-wider">Trofeos</h2>
      <UCard>
        <ul class="flex flex-col gap-3">
          <li v-for="row in stats" :key="row.player_id" class="flex flex-col gap-1">
            <div class="flex justify-between text-sm">
              <span class="text-light">{{ row.name }}</span>
              <span class="text-secondary font-bold">🏆 {{ row.tournaments_won }}</span>
            </div>
            <div class="w-full h-2 bg-pingpong-900 rounded-full overflow-hidden">
              <div
                class="h-full bg-pingpong-500 rounded-full transition-all"
                :style="{ width: `${(row.tournaments_won / maxTrophies) * 100}%` }"
              />
            </div>
          </li>
        </ul>
      </UCard>
    </section>
  </div>
</template>
