# CLAUDE.md · Mortal Supreme

PWA para manejar torneos de ping pong entre amigos: liga round-robin con N mesas, turnos, descansos, desempates, histórico y minijuegos para el que espera. Se usa desde el celular al lado de la mesa.

> **Cómo está organizado este archivo (3 zonas):**
> - **ZONA 1 · REGLAS VIGENTES**: normas que SIEMPRE aplican (stack, estructura, design system, datos). Seguir al pie.
> - **ZONA 2 · ESTADO ACTUAL**: cómo funciona hoy cada sistema y sus parámetros. El detalle fino está en `docs/sistemas.md`.
> - **ZONA 3 · HISTORIAL (no vigente)**: direcciones descartadas. Solo contexto; NO recomendar nada de acá como vigente.
>
> Historia con fecha: `docs/bitacora.md`.

# ━━━━━━ ZONA 1 · REGLAS VIGENTES ━━━━━━

## Stack

- **Nuxt 4** con `routeRules: { '/**': { ssr: false } }` (todo client-only: Pinia + Supabase client)
- **Vue 3** `<script setup>` en JS (los stores y utils viejos están en TS, no migrarlos por migrar)
- **Nuxt UI v4** + **Tailwind v4** CSS-first (tokens en `app/assets/css/main.css`)
- **Supabase** (Postgres, RLS deshabilitado, la app usa la anon key)
- **Pinia** (`stores/tournament.ts`, `stores/players.js`)
- **@vite-pwa/nuxt** (autoUpdate, NetworkFirst)
- **Vitest** (tests del scheduler)
- Deploy: **Vercel**, proyecto `mortal-supreme`, deploy automático al pushear `main`. A veces tarda unos minutos en tomar el push: antes de diagnosticar, mirar el status del commit en GitHub.

## Comandos

```
pnpm dev     # nuxt dev en :3000
pnpm test    # 21 tests del scheduler
pnpm build
```

Package manager: **pnpm**. `package-lock.json` sigue en el repo por herencia (ver pendientes).

## Base de datos

- MCP: **`supabase-proyectos`** (project ref `tkheozezwmgemwlrajzg`).
- Esquema completo en `supabase/schema.sql`; cambios nuevos en `supabase/migrations/` y también agregados a `schema.sql`.
- Tablas: `players`, `tournaments`, `tournament_players` (puntos/wins/losses/rests por torneo), `rounds`, `turns`, `matches`, `history` (torneos ganados), `minigame_scores`. Vista `v_player_stats`.
- `v_player_stats` cuenta **todos** los matches completados de cualquier torneo. Un torneo de prueba con jugadores reales ensucia las stats hasta que se borra (el delete de `tournaments` cascadea).
- Tabla nueva: grants explícitos a `anon` (la app no tiene auth), `authenticated` y `service_role`, y `disable row level security` como el resto.

## Estructura

```
app/
  app.config.ts              # colores Nuxt UI: primary=mesa, secondary=naranja, neutral=grafito
  layouts/default.vue        # header centrado + barra "En vivo" + nav inferior
  pages/
    index.vue                # inicio: CTA, card en vivo con mesas, último campeón, ranking top 3
    torneo/[id].vue          # torneo en vivo: mesas, próximo turno, minijuego, posiciones, desempate
    nuevo-torneo.vue, torneos.vue, jugadores.vue, jugadores/[id].vue,
    historico.vue, estadisticas.vue, ajustes.vue, unlock.vue (PIN)
  components/
    tournament/WinnerPicker.vue  # par de botones para marcar ganador (tone 'mesa' | 'light')
    tournament/LiveTag.vue       # etiqueta "En vivo"
    minigame/Modal.vue           # quién sos → intro → juego → resultado + highscores
    minigame/{Reaction,Tapper,Paddle,Simon,Whack}.vue
  composables/
    useActiveTournament.js   # useState('tournament:active'), refresca en cada cambio de ruta
    useMinigameScores.js     # top 3 por juego + save
    useRestMessages.js
  stores/tournament.ts       # load, recordWinner optimista, avance de turnos, desempates
  utils/scheduler.ts         # round-robin greedy con T mesas
  utils/minigames.js         # MINIGAMES + minigameForTurn(turn)
supabase/schema.sql, supabase/migrations/
```

## Design system: "Scoreboard claro"

Tema único claro, alto contraste. **No hay dark mode** (`colorMode` forzado a light con `storageKey: 'mortal-color-mode'`).

| Token | Uso |
|---|---|
| `bg-canvas` | fondo de página |
| `bg-surface border-line rounded-xl` | toda card/sección |
| `bg-sunken` | filas hundidas, estados active |
| `text-ink` / `text-muted` | texto principal / secundario. Nada más claro que `muted` |
| `text-accent` / `bg-accent` (`#d94f00`) | acento único, CTAs (`UButton color="secondary"`) |
| `text-win`, `bg-win-soft`, `text-loss` | ganó / perdió |
| `bg-board` + `board-*` | superficies "en vivo" en azul mesa (minijuegos, campeón, barra en vivo) |
| `.mesa` (clase global) | **el motivo de la app**: azul mesa, borde blanco 3px, línea central blanca. Cada partido que se juega es una `.mesa` |
| `bg-gold/silver/bronze` | medallas 1/2/3 con `text-ink` |

Reglas:
- `font-display` (Saira Condensed) en títulos, labels de sección (`uppercase tracking-widest text-muted text-sm font-bold`), números grandes y botones grandes. Cuerpo en Saira. Números alineados con `tabular-nums`.
- Listas: **una** card con filas separadas por `not-first:border-t`, no una card por fila.
- Dentro de `.mesa` todo va en blanco; lo que tapa la línea central lleva `relative bg-mesa-600`.
- Ganador sobre azul: blanco + corona, perdedor `text-mesa-200`. **Nunca amarillo sobre azul.**
- Modales: `UModal` con `title`/`description` + `#body`/`#footer` y `:ui="{ content: 'max-w-md' }"` (la app mide 30rem; `max-w-lg` se escapa del rail).
- Sin emojis de aviso en la UI; `UIcon` o `UAlert`.

# ━━━━━━ ZONA 2 · ESTADO ACTUAL ━━━━━━

## Torneo en vivo

- Turnos: el scheduler arma todos los turnos de la round al crearla. `currentTurn` es el primer turno `in_progress`.
- **Próximo turno**: se muestra debajo de "Jugando ahora". Un partido del próximo turno está listo cuando ninguno de sus jugadores tiene un partido sin terminar en el turno actual (`busyPlayerIds`). Si está listo, se puede cargar el ganador antes de tiempo.
- **Avance en cascada**: `checkAdvanceTurnLocal` avanza mientras el turno `in_progress` esté completo, así un turno ya jugado por adelantado se cierra solo. Devuelve una lista de avances que se persisten en orden y se revierten al revés si falla la red.
- **Desempate** (modal Finalizar): con empate arriba no hay campeón automático; se elige entre piedra, papel o tijera (tocar quién ganó) o jugar un partido. Sin empate existe "Definir con muerte súbita". Los partidos decisivos son `match_type = 'tiebreaker'` sin `turn_id`, aparecen en "Partidos extra" como `.mesa` y al cargar el ganador se abre Finalizar con ese campeón.

## Inicio y torneo activo

- `useActiveTournament` trae el último torneo `in_progress`. El layout muestra la barra "En vivo" en todas las rutas salvo `/` y la del propio torneo.
- La card del inicio es blanca, con cada partido del turno como `.mesa`, y puntero/descansa al pie.

## Minijuegos

- Juegan los que no tienen partido pendiente en el turno actual (`waitingPlayers`). Si hay más de uno, el modal pregunta "¿Quién sos?".
- Juego por turno: `minigameForTurn(turn)` = (hash del `round_id` + `turn_number`) mod 5, así cambia en cada turno.
- Highscores: top 3 en `minigame_scores`. Reflejos es menor-mejor (`lowerIsBetter`).
- Detalle de cada juego y sus constantes: `docs/sistemas.md`.

## Pendientes conocidos

- `resyncFinishedTournamentWinner` corona al puntero por puntos: editar un resultado en un torneo finalizado cuyo campeón salió de un desempate puede pisarlo.
- Dos lockfiles (`package-lock.json` y `pnpm-lock.yaml`); falta decidir si se borra el de npm.
- Existe el torneo "🧪 Torneo de prueba" (`bdca466d-ebe7-42b8-98d5-bf5c283ce236`) con jugadores reales: suma a las stats mientras exista.

# ━━━━━━ ZONA 3 · HISTORIAL (no vigente) ━━━━━━

- **Tema dark azul-sobre-azul** (paleta `pingpong`/`pelota`/`deep`, Russo One + Chakra Petch + Inter): descartado por contraste. No volver a usar texto azul sobre fondo azul.
- **Opciones de rediseño** (2026-10-11): A "Arcade negro" y B "Mesa ITTF" descartadas; ganó C "Scoreboard claro" tomando de B la mesa con línea central.
- **Tablero negro** para lo en vivo: descartado ("no va"). Se pasó a azul mesa.
- **Ganador en amarillo sobre azul**: descartado.
- **Ruta `/minijuegos`** con modo práctica: existió solo para probar los juegos y se borró.
