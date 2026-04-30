/**
 * Detecta plataforma + estado instalación PWA.
 * Maneja prompt nativo Android/Chrome (beforeinstallprompt).
 */
export function useInstallPwa() {
  const installed = ref(false)
  const platform = ref('unknown') // 'ios' | 'android' | 'desktop' | 'unknown'
  const canPromptInstall = ref(false)
  const deferredPrompt = ref(null)

  function detect() {
    if (typeof window === 'undefined') return
    // Ya instalada
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    installed.value = standalone

    // Plataforma
    const ua = window.navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(ua)) platform.value = 'ios'
    else if (/android/.test(ua)) platform.value = 'android'
    else platform.value = 'desktop'
  }

  function onBeforeInstall(e) {
    e.preventDefault()
    deferredPrompt.value = e
    canPromptInstall.value = true
  }

  function onInstalled() {
    installed.value = true
    canPromptInstall.value = false
    deferredPrompt.value = null
  }

  async function promptInstall() {
    if (!deferredPrompt.value) return false
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    deferredPrompt.value = null
    canPromptInstall.value = false
    return outcome === 'accepted'
  }

  onMounted(() => {
    detect()
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    window.removeEventListener('appinstalled', onInstalled)
  })

  return { installed, platform, canPromptInstall, promptInstall }
}
