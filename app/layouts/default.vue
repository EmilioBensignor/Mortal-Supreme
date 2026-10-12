<template>
  <div class="w-full max-w-120 min-h-dvh flex flex-col mx-auto bg-canvas overflow-x-hidden">
    <header class="sticky top-0 z-40 flex items-center justify-center bg-surface/90 backdrop-blur-md border-b border-solid border-line px-4 py-3" style="padding-top: max(0.75rem, env(safe-area-inset-top));">
      <NuxtLink to="/" class="flex items-center gap-2.5 min-w-0 font-display text-ink text-lg font-extrabold uppercase tracking-wide transition-opacity active:opacity-70">
        <img src="/icon.svg" alt="" class="size-7 shrink-0">
        <span class="truncate">Mortal Supreme</span>
      </NuxtLink>
    </header>

    <main class="flex-1 w-full max-w-full px-4 pt-5 overflow-x-hidden" :class="showLiveBar ? 'pb-40' : 'pb-28'">
      <slot />
    </main>

    <nav
      class="w-full max-w-120 flex flex-col fixed bottom-0 left-1/2 -translate-x-1/2 z-30 bg-surface border-t border-solid border-line"
      style="padding-bottom: env(safe-area-inset-bottom);"
    >
      <NuxtLink
        v-if="showLiveBar"
        :to="`/torneo/${activeTournament.id}`"
        class="flex items-center gap-2.5 bg-board text-board-fg text-sm transition-opacity active:opacity-80 px-4 py-2.5"
      >
        <TournamentLiveTag />
        <span class="flex-1 min-w-0 font-semibold truncate">{{ activeTournament.name }}</span>
        <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-board-dim" />
      </NuxtLink>
      <div class="grid grid-cols-4">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center gap-1 text-xs font-semibold transition-colors duration-150 active:opacity-70 pt-2.5 pb-2"
          :class="route.path.startsWith(item.to) ? 'text-accent' : 'text-muted'"
        >
          <UIcon :name="item.icon" class="size-5" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup>
const route = useRoute()
const { activeTournament, refresh } = useActiveTournament()

const items = [
  { label: 'Jugadores', icon: 'i-lucide-users', to: '/jugadores' },
  { label: 'Histórico', icon: 'i-lucide-trophy', to: '/historico' },
  { label: 'Torneos', icon: 'i-lucide-list', to: '/torneos' },
  { label: 'Stats', icon: 'i-lucide-bar-chart-3', to: '/estadisticas' },
]

const showLiveBar = computed(() => {
  if (!activeTournament.value) return false
  return route.path !== '/' && route.path !== `/torneo/${activeTournament.value.id}`
})

watch(() => route.path, refresh, { immediate: true })
</script>
