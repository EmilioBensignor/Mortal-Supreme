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

<template>
  <div class="flex flex-col gap-5">
    <h1 class="text-light text-2xl font-display font-bold">Histórico</h1>

    <!-- PODIO -->
    <section v-if="podium.length > 0" class="flex items-end justify-center gap-2">
      <!-- 2do (izq) - PLATA -->
      <NuxtLink
        v-if="podium[1]"
        :to="`/jugadores/${podium[1].player_id}`"
        class="flex flex-col items-center gap-2 flex-1 max-w-30 active:opacity-70 transition-opacity"
      >
        <div class="size-14 flex items-center justify-center bg-[#d3dce6] rounded-full font-display text-pingpong-950 text-lg font-bold">
          2
        </div>
        <div class="flex flex-col items-center gap-1 w-full bg-linear-to-b from-[#d3dce6]/20 to-pingpong-700/30 rounded-t-2xl border border-solid border-[#d3dce6]/40 px-2 pt-3 pb-4 min-h-32">
          <span class="text-light text-xs font-semibold text-center wrap-break-word">{{ podium[1].name }}</span>
          <span class="font-mono-num text-[#d3dce6] text-2xl font-bold mt-auto">{{ podium[1].tournaments_won }}</span>
          <span class="text-pingpong-300 text-[10px] uppercase tracking-wider">títulos</span>
        </div>
      </NuxtLink>

      <!-- 1ro (centro) - ORO -->
      <NuxtLink
        v-if="podium[0]"
        :to="`/jugadores/${podium[0].player_id}`"
        class="flex flex-col items-center gap-2 flex-1 max-w-32 active:opacity-70 transition-opacity"
      >
        <UIcon name="i-lucide-crown" class="size-6 text-[#ffd24a] -mb-1" />
        <div class="size-16 flex items-center justify-center bg-[#ffd24a] rounded-full font-display text-pingpong-950 text-xl font-bold">
          1
        </div>
        <div class="flex flex-col items-center gap-1 w-full bg-linear-to-b from-[#ffd24a]/30 to-pingpong-700/30 rounded-t-2xl border border-solid border-[#ffd24a]/50 px-2 pt-3 pb-5 min-h-40" style="box-shadow: 0 0 28px -6px rgba(255, 210, 74, 0.5);">
          <span class="text-light text-sm font-bold text-center wrap-break-word">{{ podium[0].name }}</span>
          <span class="font-mono-num text-[#ffd24a] text-3xl font-bold mt-auto">{{ podium[0].tournaments_won }}</span>
          <span class="text-[#ffd24a]/80 text-[10px] uppercase tracking-wider">títulos</span>
        </div>
      </NuxtLink>

      <!-- 3ro (der) - BRONCE -->
      <NuxtLink
        v-if="podium[2]"
        :to="`/jugadores/${podium[2].player_id}`"
        class="flex flex-col items-center gap-2 flex-1 max-w-30 active:opacity-70 transition-opacity"
      >
        <div class="size-12 flex items-center justify-center bg-[#cd7f32] rounded-full font-display text-pingpong-950 text-base font-bold">
          3
        </div>
        <div class="flex flex-col items-center gap-1 w-full bg-linear-to-b from-[#cd7f32]/20 to-pingpong-700/30 rounded-t-2xl border border-solid border-[#cd7f32]/40 px-2 pt-3 pb-3 min-h-26">
          <span class="text-light text-xs font-semibold text-center wrap-break-word">{{ podium[2].name }}</span>
          <span class="font-mono-num text-[#cd7f32] text-xl font-bold mt-auto">{{ podium[2].tournaments_won }}</span>
          <span class="text-[#cd7f32]/80 text-[10px] uppercase tracking-wider">títulos</span>
        </div>
      </NuxtLink>
    </section>

    <!-- RESTO -->
    <section v-if="rest.length > 0" class="flex flex-col gap-2">
      <h2 class="text-pingpong-200 text-xs font-semibold uppercase tracking-wider">Resto del ranking</h2>
      <ul class="flex flex-col gap-1.5 bg-pingpong-900/40 rounded-2xl border border-solid border-pingpong-700/30 p-2">
        <li v-for="(p, i) in rest" :key="p.player_id">
          <NuxtLink
            :to="`/jugadores/${p.player_id}`"
            class="flex items-center gap-3 rounded-xl active:bg-pingpong-700/40 transition-colors px-3 py-2.5"
          >
            <span class="size-7 flex items-center justify-center bg-pingpong-700 rounded-full font-mono-num text-pingpong-100 text-xs font-bold shrink-0">
              {{ i + 4 }}
            </span>
            <span class="flex-1 text-light text-sm font-semibold truncate">{{ p.name }}</span>
            <div class="flex items-center gap-3 text-xs shrink-0">
              <span class="font-mono-num text-pingpong-300">{{ p.wins }}-{{ p.losses }}</span>
              <span class="font-mono-num text-pingpong-200 w-8 text-right">{{ Math.round(p.win_rate * 100) }}%</span>
              <span class="font-mono-num text-secondary text-base font-bold w-6 text-right">{{ p.tournaments_won }}</span>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- VACIO -->
    <section
      v-if="!podium.length"
      class="flex flex-col items-center gap-2 bg-pingpong-900/40 rounded-2xl border border-solid border-pingpong-700/30 text-center px-6 py-10"
    >
      <UIcon name="i-lucide-trophy" class="size-10 text-pingpong-500" />
      <p class="text-pingpong-200 text-sm">Sin torneos finalizados aún</p>
      <p class="text-pingpong-400 text-xs">Jugá tu primer torneo para empezar el ranking</p>
    </section>
  </div>
</template>
