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
pnpm install

# 3. Crear el schema en Supabase
# Pegar el contenido de supabase/schema.sql en el SQL Editor de Supabase y ejecutar

# 4. Dev
pnpm dev

# 5. Tests del scheduler (21 tests para N=2..8 con T=1,2)
pnpm test

# 6. Build producción
pnpm build
```

## Decisiones del MVP

- **Sin auth**: single-user, todo abierto. La columna `owner_user_id` está preparada para multi-user futuro.
- **Scheduler greedy** (no perfecto pero válido): respeta restricciones duras (1 jugador por turn, T mesas) y balancea descansos. Tests cubren N=2..8 con T=1 y T=2.
- **Offline básico**: el service worker (NetworkFirst) cachea shell y respuestas Supabase. Para offline robusto con cola de mutaciones, ver "Roadmap" abajo.
- **Diseño**: tema claro "Scoreboard" con la mesa azul como motivo. Tokens y reglas en `CLAUDE.md`.

## Documentación

- `CLAUDE.md`: reglas vigentes, design system, estado actual de cada sistema.
- `docs/sistemas.md`: detalle del store del torneo, desempate y minijuegos.
- `docs/bitacora.md`: historia con fecha.

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
