# Bitácora: cambios grandes y decisiones (con fecha)

Historia del proyecto. No es contexto de arranque; se lee si el tema vuelve.

## Rediseño, minijuegos, desempate y próximo turno (2026-10-11)

Commits `be8f3a7` y `0f73d95`.

### Producto

- **Inicio**: título centrado en una línea, CTA, card en vivo con cada partido como mesa, último campeón y ranking histórico top 3.
- **Torneo activo siempre a mano**: barra "En vivo" sobre el nav en todas las pantallas menos el inicio y el propio torneo.
- **Próximo turno**: con más de 4 jugadores y 2 mesas, una mesa termina antes y no se sabía si el siguiente partido podía arrancar. Ahora se ve el próximo turno con "Pueden arrancar" o "Esperando X", y se puede cargar el resultado por adelantado.
- **Minijuegos** para el que espera: 5 juegos con highscores, uno distinto por turno.
- **Desempate**: piedra, papel o tijera, partido de desempate o muerte súbita.
- Se borró el jugador Guido (no tenía torneos, partidos ni histórico).

### Rediseño "Scoreboard claro"

El tema dark azul-sobre-azul tenía textos que no se leían (azul de marca y `pingpong-400` como texto sobre fondo azul). Se mostraron tres direcciones del inicio (Arcade negro, Mesa ITTF, Scoreboard claro); ganó la C, con la mesa con línea central de la B integrada en los partidos. Iteraciones del mismo día:

- Tablero de lo en vivo en negro: no va, pasó a azul mesa.
- Ganador en amarillo sobre azul: no va, pasó a blanco con corona.
- La card en vivo del inicio pasó a blanca con las mesas adentro.
- Header y título del inicio centrados, sin subtítulo.

### Bugs encontrados

- **Modal más ancho que la app**: `UModal` usa `max-w-lg` (32rem) y el rail mide 30rem. Todos los modales llevan `max-w-md`.
- **HMR de Pinia**: al agregar un computed al store, la instancia vieja no lo tenía (`waitingPlayers.length` de undefined). Se sumó `acceptHMRUpdate`.
- **Topo**: la grilla sin `grid-rows-3` agrandaba la fila del objetivo.

### Infra

- Migration `supabase/migrations/20261011_minigame_scores.sql` aplicada con el MCP `supabase-proyectos`.
- `canvas-confetti` sumado a `vite.optimizeDeps.include` (evita el reload del pre-bundle en dev).
- Se commiteó `pnpm-lock.yaml` + `pnpm-workspace.yaml`.
- El deploy de Vercel tardó varios minutos en tomar el push; la integración con Git estaba bien.
