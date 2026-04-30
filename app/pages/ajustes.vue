<script setup>
const online = useOnline()
const { installed, platform, canPromptInstall, promptInstall } = useInstallPwa()

const showInstall = ref(false)

async function handleInstall() {
  if (canPromptInstall.value) {
    const ok = await promptInstall()
    if (!ok) showInstall.value = true
  } else {
    showInstall.value = true
  }
}

const platformLabel = computed(() => {
  if (platform.value === 'ios') return 'iOS'
  if (platform.value === 'android') return 'Android'
  if (platform.value === 'desktop') return 'Escritorio'
  return 'Desconocida'
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <h1 class="text-light text-2xl font-display font-bold">Ajustes</h1>

    <!-- Estado conexión -->
    <section class="flex flex-col gap-2">
      <h2 class="text-pingpong-200 text-xs font-semibold uppercase tracking-wider">Conexión</h2>
      <div class="flex items-center gap-3 bg-pingpong-900/40 rounded-2xl border border-solid border-pingpong-700/30 px-4 py-3">
        <span
          class="size-2.5 rounded-full shrink-0"
          :class="online ? 'bg-emerald-400' : 'bg-pelota-500 animate-pulse'"
        />
        <div class="flex flex-col gap-0.5 flex-1 min-w-0">
          <p class="text-light text-sm font-semibold">{{ online ? 'Online' : 'Offline' }}</p>
          <p class="text-pingpong-300 text-xs">
            {{ online ? 'Cambios se sincronizan en tiempo real' : 'Cambios se guardarán al reconectar' }}
          </p>
        </div>
      </div>
    </section>

    <!-- App -->
    <section class="flex flex-col gap-2">
      <h2 class="text-pingpong-200 text-xs font-semibold uppercase tracking-wider">App</h2>
      <button
        v-if="!installed"
        type="button"
        class="flex items-center gap-3 bg-pingpong-900/40 active:bg-pingpong-700/60 rounded-2xl border border-solid border-pingpong-700/30 transition-colors text-left px-4 py-3"
        @click="handleInstall"
      >
        <UIcon name="i-lucide-download" class="size-5 text-secondary shrink-0" />
        <div class="flex flex-col gap-0.5 flex-1 min-w-0">
          <p class="text-light text-sm font-semibold">Instalar app</p>
          <p class="text-pingpong-300 text-xs">Acceso rápido + funciona sin red</p>
        </div>
        <UIcon name="i-lucide-chevron-right" class="size-4 text-pingpong-400 shrink-0" />
      </button>
      <div
        v-else
        class="flex items-center gap-3 bg-pingpong-900/40 rounded-2xl border border-solid border-pingpong-700/30 px-4 py-3"
      >
        <UIcon name="i-lucide-check-circle-2" class="size-5 text-success shrink-0" />
        <p class="flex-1 text-light text-sm font-semibold">App instalada</p>
      </div>

      <div class="flex items-center justify-between gap-3 bg-pingpong-900/20 rounded-2xl border border-solid border-pingpong-700/20 px-4 py-3">
        <span class="text-pingpong-300 text-xs">Plataforma detectada</span>
        <span class="font-mono-num text-pingpong-100 text-xs font-semibold">{{ platformLabel }}</span>
      </div>
    </section>

    <!-- Info -->
    <section class="flex flex-col gap-2">
      <h2 class="text-pingpong-200 text-xs font-semibold uppercase tracking-wider">Acerca de</h2>
      <div class="flex flex-col gap-2 bg-pingpong-900/40 rounded-2xl border border-solid border-pingpong-700/30 px-4 py-3 text-xs">
        <div class="flex justify-between">
          <span class="text-pingpong-300">Versión</span>
          <span class="font-mono-num text-pingpong-100">0.1.0 MVP</span>
        </div>
        <div class="flex justify-between">
          <span class="text-pingpong-300">Hecho por</span>
          <span class="text-pingpong-100">Lio</span>
        </div>
      </div>
    </section>

    <!-- Modal instalar -->
    <UModal :open="showInstall" @update:open="showInstall = $event">
      <template #content>
        <div class="flex flex-col gap-4 p-6">
          <h3 class="text-light text-lg font-display font-bold">Instalá Mortal Supreme</h3>

          <ol v-if="platform === 'ios'" class="flex flex-col gap-3 text-sm text-light">
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-pingpong-700 rounded-full font-mono-num text-xs font-bold shrink-0">1</span>
              <span>Tocá el botón <strong>Compartir</strong>
                <UIcon name="i-lucide-share" class="size-4 inline mx-1" />
                en la barra inferior de Safari
              </span>
            </li>
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-pingpong-700 rounded-full font-mono-num text-xs font-bold shrink-0">2</span>
              <span>Bajá y elegí <strong>Agregar a pantalla de inicio</strong></span>
            </li>
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-pingpong-700 rounded-full font-mono-num text-xs font-bold shrink-0">3</span>
              <span>Tocá <strong>Agregar</strong>. Listo, abrila desde el ícono</span>
            </li>
          </ol>

          <ol v-else-if="platform === 'android'" class="flex flex-col gap-3 text-sm text-light">
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-pingpong-700 rounded-full font-mono-num text-xs font-bold shrink-0">1</span>
              <span>Abrí el menú de Chrome
                <UIcon name="i-lucide-more-vertical" class="size-4 inline mx-1" />
                (3 puntos arriba a la derecha)
              </span>
            </li>
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-pingpong-700 rounded-full font-mono-num text-xs font-bold shrink-0">2</span>
              <span>Tocá <strong>Instalar app</strong> o <strong>Agregar a pantalla principal</strong></span>
            </li>
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-pingpong-700 rounded-full font-mono-num text-xs font-bold shrink-0">3</span>
              <span>Confirmá. Listo, abrila desde el ícono</span>
            </li>
          </ol>

          <ol v-else class="flex flex-col gap-3 text-sm text-light">
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-pingpong-700 rounded-full font-mono-num text-xs font-bold shrink-0">1</span>
              <span>En Chrome/Edge mirá el ícono
                <UIcon name="i-lucide-monitor-down" class="size-4 inline mx-1" />
                en la barra de URL
              </span>
            </li>
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-pingpong-700 rounded-full font-mono-num text-xs font-bold shrink-0">2</span>
              <span>Tocá <strong>Instalar</strong></span>
            </li>
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-pingpong-700 rounded-full font-mono-num text-xs font-bold shrink-0">3</span>
              <span>Listo, abrila desde el dock o aplicaciones</span>
            </li>
          </ol>

          <div class="flex justify-end mt-2">
            <UButton color="primary" variant="soft" @click="showInstall = false">Cerrar</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
