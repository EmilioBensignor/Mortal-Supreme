<script setup>
const supabase = useSupabaseClient()

const { data: activeTournament } = await useAsyncData('active-tournament', async () => {
  const { data } = await supabase
    .from('tournaments')
    .select('*')
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-8 min-h-[calc(100dvh-12rem)] text-center">
    <div class="flex flex-col items-center gap-4">
      <img src="/icon.svg" class="size-32" alt="">
      <div class="flex flex-col gap-1">
        <h1 class="text-light text-3xl font-display font-bold uppercase tracking-wide">Mortal Supreme</h1>
        <p class="text-pingpong-200 text-sm">El torneo definitivo de ping pong</p>
      </div>
    </div>

    <div class="w-full flex flex-col gap-3">
      <UButton
        v-if="activeTournament"
        :to="`/torneo/${activeTournament.id}`"
        color="secondary"
        block
        size="xl"
        icon="i-lucide-play"
        class="glow-secondary"
      >
        Continuar torneo
      </UButton>
      <UButton
        to="/nuevo-torneo"
        color="secondary"
        :variant="activeTournament ? 'outline' : 'solid'"
        block
        size="xl"
        icon="i-lucide-swords"
        :class="activeTournament ? '' : 'glow-secondary'"
      >
        {{ activeTournament ? 'Crear otro torneo' : 'Crear torneo' }}
      </UButton>
    </div>
  </div>
</template>
