---
paths:
  - "app/components/**"
  - "app/pages/torneo/**"
  - "app/stores/**"
  - "app/utils/**"
---

# Sistemas: torneo, desempate y minijuegos

Cómo está construido cada sistema y qué parámetros se tunean. Se carga al tocar componentes, el torneo, stores o utils.

## Store del torneo · `stores/tournament.ts`

Derivadas que usa la UI:

| Derivada | Qué es |
|---|---|
| `currentRound` | última round no completada ni abortada |
| `currentTurn` | primer turno de la round que no está `completed` |
| `currentTurnMatches` | partidos del turno actual, por mesa |
| `nextTurn`, `nextTurnMatches` | primer turno `pending` posterior al actual |
| `busyPlayerIds` | jugadores con partido sin terminar en el turno actual |
| `waitingPlayers` | jugadores del torneo que no están en `busyPlayerIds` (los que pueden jugar un minijuego) |
| `standings` | puntos, después wins, después menos losses |

`recordWinner` es optimista: actualiza el match y los puntos en memoria, avanza turnos y después persiste. Si algo falla revierte todo, avances incluidos en orden inverso.

`checkAdvanceTurnLocal(turnId)` solo avanza si el turno del match está `in_progress`. Cargar un partido del próximo turno no avanza nada; cuando se completa el turno actual, el loop sigue cerrando turnos mientras el siguiente ya esté completo. El descanso (`rests +1`) se suma al jugador que descansa cuando su turno pasa a `in_progress`.

`unrecordWinner` revierte puntos pero no el avance de turno (a propósito).

## Desempate · `pages/torneo/[id].vue`

El modal Finalizar tiene tres pasos (`finishStep`):

| Paso | Qué muestra |
|---|---|
| `summary` | campeón (puntero, o el elegido por desempate) y botones de finalizar. Con empate: alerta y las dos vías de desempate. Sin empate: link "Definir con muerte súbita" |
| `rps` | jugadores empatados; el que se toca queda campeón (`decidedBy = 'rps'`) |
| `match` | elegir 2 jugadores (preseleccionados los empatados o los 2 primeros) y crear el partido |

`isDecider(match)` = sin `turn_id` y `match_type` `tiebreaker` o `final`. Al cargar el ganador de uno se abre el modal con ese campeón (`decidedBy = 'match'`). Los `tiebreaker` no suman puntos; los `final` sí (`counts = regular || final`).

Todos los partidos sin turno pendientes (extra, desempate, final) se ven en la sección "Partidos extra".

## Minijuegos · `components/minigame/`

Todos emiten `finish(score)` con un entero y limpian timers/rAF en `onBeforeUnmount`. Área de juego: `h-[min(20rem,50dvh)]`.

| Juego | Archivo | Score | Parámetros |
|---|---|---|---|
| Reflejos | `Reaction.vue` | ms promedio, menor es mejor | `TRIES = 3`, espera aleatoria 1.2 a 4 s; tocar antes = reintentar |
| Metralleta | `Tapper.vue` | toques | `DURATION_MS = 5000`, arranca con el primer toque |
| Pelotita | `Paddle.vue` | golpes | `BASE_GRAVITY = 900`, sube 8% por golpe; zona de golpe = 25% inferior; tocar antes de la zona o mientras sube = pierde |
| Memoria | `Simon.vue` | último nivel completo | `FLASH_MS = 420`, `GAP_MS = 180` |
| Topo | `Whack.vue` | puntos | `DURATION_MS = 15000`; el objetivo se mueve cada `max(450, 1000 - elapsed/30)` ms; tocar vacío resta 1. Grilla `grid-rows-3` fija: sin filas fijas, la fila del objetivo crecía |

`Modal.vue`: guarda el puntaje al terminar y recarga el top 3. "¡Nuevo récord!" compara contra el primero del top antes de guardar.
