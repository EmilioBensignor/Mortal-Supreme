/**
 * Gate por PIN. Si runtimeConfig.public.appPin está definido y no coincide
 * con el guardado en localStorage → redirige a /unlock.
 *
 * Esto NO es seguridad real (la PIN se ve en el bundle JS y la anon key
 * de Supabase también). Es solo barrera UX para evitar curiosos.
 * Para seguridad real → activar RLS + Auth.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  const config = useRuntimeConfig()
  const expectedPin = config.public.appPin
  if (!expectedPin) return // Sin PIN configurado, abierto
  if (to.path === '/unlock') return

  const storedPin = window.localStorage.getItem('app-pin')
  if (storedPin !== expectedPin) {
    return navigateTo(`/unlock?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
