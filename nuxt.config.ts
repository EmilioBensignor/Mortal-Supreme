// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-04-30',
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/supabase',
    '@vite-pwa/nuxt',
  ],

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  // Las páginas son client-only (necesitan Supabase client + stores Pinia
  // con datos dinámicos). Esto evita el bug de Pinia + devalue al hidratar
  // payloads SSR, sin tener que poner ssr:false global (que rompe vite-node).
  routeRules: {
    '/**': { ssr: false },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // Re-exposición tipada de las envs de Supabase para casos donde no se use el módulo
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      // PIN de acceso (vacío = sin gate). NO es seguridad real, solo barrera UX.
      appPin: process.env.NUXT_PUBLIC_APP_PIN ?? '',
    },
  },

  supabase: {
    redirect: false, // single-user MVP, sin auth
  },

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: '',
  },

  app: {
    head: {
      htmlAttrs: { lang: 'es', class: 'dark' },
      title: 'Mortal Supreme',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'El torneo definitivo de ping pong de Mortal Kombat' },
        { name: 'theme-color', content: '#0B5FFF' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Russo+One&family=Chakra+Petch:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Mortal Supreme',
      short_name: 'Mortal',
      description: 'El torneo definitivo de ping pong',
      lang: 'es',
      theme_color: '#0B5FFF',
      background_color: '#06122B',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.origin === self.location.origin,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'app-shell',
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
          },
        },
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-rest',
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
          },
        },
      ],
    },
    devOptions: {
      enabled: false, // SW solo en build/prod — evita warnings de glob en dev
      type: 'module',
    },
  },

  ui: {
    // Nuxt UI v4 — color primario "ping pong blue"
    theme: {
      colors: ['primary', 'secondary', 'success', 'warning', 'error'],
    },
  },

  typescript: {
    strict: true,
  },

  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit', 'workbox-window'],
    },
  },
})
