<template>
  <div class="flex flex-col gap-5">
    <h1 class="font-display text-ink text-3xl font-extrabold leading-none uppercase">Ajustes</h1>

    <!-- Estado conexión -->
    <section class="flex flex-col gap-2">
      <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">Conexión</h2>
      <div class="flex items-center gap-3 bg-surface border border-solid border-line rounded-xl px-4 py-3">
        <span
          class="size-2.5 rounded-full shrink-0"
          :class="online ? 'bg-win' : 'bg-accent animate-pulse'"
        />
        <div class="flex flex-col gap-0.5 flex-1 min-w-0">
          <p class="text-ink text-sm font-semibold">{{ online ? 'Online' : 'Offline' }}</p>
          <p class="text-muted text-xs">
            {{ online ? 'Cambios se sincronizan en tiempo real' : 'Cambios se guardarán al reconectar' }}
          </p>
        </div>
      </div>
    </section>

    <!-- App -->
    <section class="flex flex-col gap-2">
      <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">App</h2>
      <button
        v-if="!installed"
        type="button"
        class="flex items-center gap-3 bg-surface active:bg-sunken border border-solid border-line rounded-xl transition-colors text-left px-4 py-3"
        @click="handleInstall"
      >
        <UIcon name="i-lucide-download" class="size-5 text-accent shrink-0" />
        <div class="flex flex-col gap-0.5 flex-1 min-w-0">
          <p class="text-ink text-sm font-semibold">Instalar app</p>
          <p class="text-muted text-xs">Acceso rápido + funciona sin red</p>
        </div>
        <UIcon name="i-lucide-chevron-right" class="size-4 text-muted shrink-0" />
      </button>
      <div
        v-else
        class="flex items-center gap-3 bg-surface border border-solid border-line rounded-xl px-4 py-3"
      >
        <UIcon name="i-lucide-check-circle-2" class="size-5 text-win shrink-0" />
        <p class="flex-1 text-ink text-sm font-semibold">App instalada</p>
      </div>

      <div class="flex items-center justify-between gap-3 bg-sunken border border-solid border-line rounded-xl px-4 py-3">
        <span class="text-muted text-xs">Plataforma detectada</span>
        <span class="text-ink text-xs font-semibold tabular-nums">{{ platformLabel }}</span>
      </div>
    </section>

    <!-- Seguridad (solo si hay PIN) -->
    <section v-if="hasPin" class="flex flex-col gap-2">
      <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">Seguridad</h2>
      <button
        type="button"
        class="flex items-center gap-3 bg-surface active:bg-sunken border border-solid border-line rounded-xl transition-colors text-left px-4 py-3"
        @click="lock"
      >
        <UIcon name="i-lucide-lock" class="size-5 text-muted shrink-0" />
        <div class="flex flex-col gap-0.5 flex-1 min-w-0">
          <p class="text-ink text-sm font-semibold">Bloquear app</p>
          <p class="text-muted text-xs">Pedirá el PIN al volver</p>
        </div>
        <UIcon name="i-lucide-chevron-right" class="size-4 text-muted shrink-0" />
      </button>
    </section>

    <!-- Info -->
    <section class="flex flex-col gap-2">
      <h2 class="font-display text-muted text-sm font-bold uppercase tracking-widest">Acerca de</h2>
      <div class="flex flex-col gap-2 bg-surface border border-solid border-line rounded-xl px-4 py-3 text-xs">
        <div class="flex justify-between">
          <span class="text-muted">Versión</span>
          <span class="text-ink tabular-nums">0.1.0 MVP</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted">Hecho por</span>
          <span class="text-ink">Lio</span>
        </div>
      </div>
    </section>

    <!-- Modal instalar -->
    <UModal :open="showInstall" title="Instalá Mortal Supreme" :ui="{ content: 'max-w-md' }" @update:open="showInstall = $event">
      <template #body>
        <div class="flex flex-col gap-4">

          <ol v-if="platform === 'ios'" class="flex flex-col gap-3 text-ink text-sm">
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-accent rounded-full font-display text-white text-xs font-bold tabular-nums shrink-0">1</span>
              <span>Tocá el botón <strong>Compartir</strong>
                <UIcon name="i-lucide-share" class="size-4 inline mx-1" />
                en la barra inferior de Safari
              </span>
            </li>
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-accent rounded-full font-display text-white text-xs font-bold tabular-nums shrink-0">2</span>
              <span>Bajá y elegí <strong>Agregar a pantalla de inicio</strong></span>
            </li>
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-accent rounded-full font-display text-white text-xs font-bold tabular-nums shrink-0">3</span>
              <span>Tocá <strong>Agregar</strong>. Listo, abrila desde el ícono</span>
            </li>
          </ol>

          <ol v-else-if="platform === 'android'" class="flex flex-col gap-3 text-ink text-sm">
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-accent rounded-full font-display text-white text-xs font-bold tabular-nums shrink-0">1</span>
              <span>Abrí el menú de Chrome
                <UIcon name="i-lucide-more-vertical" class="size-4 inline mx-1" />
                (3 puntos arriba a la derecha)
              </span>
            </li>
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-accent rounded-full font-display text-white text-xs font-bold tabular-nums shrink-0">2</span>
              <span>Tocá <strong>Instalar app</strong> o <strong>Agregar a pantalla principal</strong></span>
            </li>
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-accent rounded-full font-display text-white text-xs font-bold tabular-nums shrink-0">3</span>
              <span>Confirmá. Listo, abrila desde el ícono</span>
            </li>
          </ol>

          <ol v-else class="flex flex-col gap-3 text-ink text-sm">
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-accent rounded-full font-display text-white text-xs font-bold tabular-nums shrink-0">1</span>
              <span>En Chrome/Edge mirá el ícono
                <UIcon name="i-lucide-monitor-down" class="size-4 inline mx-1" />
                en la barra de URL
              </span>
            </li>
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-accent rounded-full font-display text-white text-xs font-bold tabular-nums shrink-0">2</span>
              <span>Tocá <strong>Instalar</strong></span>
            </li>
            <li class="flex gap-3">
              <span class="size-6 flex items-center justify-center bg-accent rounded-full font-display text-white text-xs font-bold tabular-nums shrink-0">3</span>
              <span>Listo, abrila desde el dock o aplicaciones</span>
            </li>
          </ol>

          <div class="flex justify-end mt-2">
            <UButton color="neutral" variant="outline" @click="showInstall = false">Cerrar</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
const online = useOnline()
const { installed, platform, canPromptInstall, promptInstall } = useInstallPwa()
const config = useRuntimeConfig()
const hasPin = !!config.public.appPin

const showInstall = ref(false)

function lock() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem('app-pin')
  navigateTo('/unlock')
}

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
