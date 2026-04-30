# 🏓 Mortal Supreme

PWA para gestionar torneos de ping pong entre amigos. Mobile-first, offline-friendly, hecha para usar desde el celular en el club o en casa.

## Stack

- **Nuxt 4** + Vue 3 + TypeScript estricto
- **Nuxt UI v4** (componentes) + Tailwind v4
- **Supabase** (Postgres, sin RLS por ahora — single-user MVP)
- **Pinia** (state)
- **@vite-pwa/nuxt** (PWA + service worker)
- **Vitest** (tests del scheduler)

## Setup

```bash
# 1. Variables de entorno
cp .env.example .env
# Completar SUPABASE_URL y SUPABASE_KEY (anon public key) con tus valores

# 2. Instalar
npm install

# 3. Crear el schema en Supabase
# Pegar el contenido de supabase/schema.sql en el SQL Editor de Supabase y ejecutar

# 4. Dev
npm run dev

# 5. Tests del scheduler (21 tests para N=2..8 con T=1,2)
npm test

# 6. Build producción
npm run build
```

## Decisiones del MVP

- **Sin auth**: single-user, todo abierto. La columna `owner_user_id` está preparada para multi-user futuro.
- **Scheduler greedy** (no perfecto pero válido): respeta restricciones duras (1 jugador por turn, T mesas) y balancea descansos. Tests cubren N=2..8 con T=1 y T=2.
- **Offline básico**: el service worker (NetworkFirst) cachea shell y respuestas Supabase. Para offline robusto con cola de mutaciones, ver "Roadmap" abajo.
- **Paleta**: azul ITTF (mesa de torneo) + naranja pelotita.

## Estructura

```
app/
  app.vue              # shell + indicador online
  app.config.ts        # tema Nuxt UI
  layouts/default.vue  # nav inferior + header
  pages/
    index.vue          # home: torneo activo / últimos torneos
    jugadores.vue      # CRUD players
    jugadores/[id].vue # detalle jugador + h2h
    historico.vue      # ranking
    estadisticas.vue   # win rate + trofeos
    nuevo-torneo.vue   # wizard 3 pasos
    torneo/[id].vue    # vista en vivo del torneo
  stores/
    players.ts
    tournament.ts      # incluye scheduler + persistencia
  utils/
    scheduler.ts       # round-robin greedy con T mesas
  composables/
    useRestMessages.ts # mensajes random para el que descansa
  assets/css/main.css  # tokens de paleta
supabase/
  schema.sql           # ejecutar en SQL Editor
tests/
  scheduler.test.ts    # 21 tests
types/
  database.ts          # stub (reemplazar por gen types ts)
public/
  icon.svg             # icono base (paleta de ping pong)
  pwa-*.png            # iconos generados desde icon.svg
```

## Generar tipos TS desde Supabase (recomendado)

```bash
npx supabase gen types typescript --project-id <REF> --schema public > types/database.ts
```

## Roadmap (post-MVP)

- Cola de mutaciones offline en IndexedDB con flush al volver online
- Auth + multi-user (activar RLS)
- Brackets / eliminación / king-of-the-table
- Marcador en vivo de puntos durante un match
- Compartir resultado como imagen para WhatsApp
