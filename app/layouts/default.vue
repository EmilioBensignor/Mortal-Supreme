<script setup>
const route = useRoute()
const items = [
  { label: 'Jugadores', icon: 'i-lucide-users', to: '/jugadores' },
  { label: 'Histórico', icon: 'i-lucide-trophy', to: '/historico' },
  { label: 'Stats', icon: 'i-lucide-bar-chart-3', to: '/estadisticas' },
  { label: 'Ajustes', icon: 'i-lucide-settings', to: '/ajustes' },
]
</script>

<template>
  <div class="w-full max-w-120 min-h-dvh flex flex-col mx-auto bg-pingpong-950/40 shadow-2xl shadow-black/30 ring-1 ring-pingpong-700/30 overflow-x-hidden">
    <header class="sticky top-0 z-40 flex items-center justify-center bg-pingpong-950/85 backdrop-blur-md border-b border-solid border-pingpong-700/40 px-4 py-3" style="padding-top: max(0.75rem, env(safe-area-inset-top));">
      <NuxtLink to="/" class="flex items-center gap-2 min-w-0 text-light font-display font-bold uppercase tracking-wider transition-opacity active:opacity-70">
        <img src="/icon.svg" alt="" class="size-8 shrink-0">
        <span class="truncate">Mortal Supreme</span>
      </NuxtLink>
    </header>

    <main class="flex-1 w-full max-w-full px-4 pt-4 pb-28 overflow-x-hidden">
      <slot />
    </main>

    <nav
      class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-120 z-30 grid grid-cols-4 bg-pingpong-950/95 backdrop-blur-md border-t border-solid border-pingpong-700/40"
      style="padding-bottom: env(safe-area-inset-bottom);"
    >
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-1 text-xs transition-colors duration-150 active:opacity-70 pt-2 pb-2"
        :class="route.path === item.to ? 'text-secondary' : 'text-pingpong-300'"
      >
        <UIcon :name="item.icon" class="size-5" />
        <span class="font-medium">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>
