/**
 * Desregistra cualquier service worker viejo (de la primera corrida con devOptions.enabled=true)
 * y limpia caches del browser. Solo corre en cliente, una vez.
 *
 * Cuando volvamos a habilitar el PWA en producción, este plugin sigue siendo seguro:
 * el SW de prod se registra después de la limpieza con un nombre distinto.
 */
export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  // En dev: matar todos los SW activos (el viejo /dev-sw.js que generaba 404).
  // En prod: dejar que vite-pwa registre el suyo después.
  if (import.meta.dev) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const r of regs) r.unregister().catch(() => {})
    }).catch(() => {})

    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const k of keys) caches.delete(k).catch(() => {})
      }).catch(() => {})
    }
  }
})
