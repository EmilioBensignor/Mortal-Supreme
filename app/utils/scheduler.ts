/**
 * Scheduler greedy para round-robin con T mesas.
 *
 * Reglas duras:
 *  - Cada par de jugadores juega exactamente una vez por round (round-robin completo).
 *  - Un jugador NO puede aparecer en 2 matches del mismo turn.
 *  - Por turn entran como máximo T matches en paralelo (T = mesas).
 *
 * Objetivos:
 *  - Minimizar la cantidad de turns.
 *  - Distribuir descansos lo más equitativamente posible.
 */

export interface SchedulerInput {
  /** IDs estables de los jugadores en el orden que el caller quiera */
  playerIds: string[]
  /** Cantidad de mesas disponibles */
  tables: number
  /** Cantidad acumulada de descansos previos por jugador (para arrastrar entre rounds) */
  previousRests?: Record<string, number>
}

export interface ScheduledMatch {
  player1: string
  player2: string
  /** Mesa asignada (1..T) */
  table: number
}

export interface ScheduledTurn {
  turnNumber: number
  matches: ScheduledMatch[]
  /** Jugadores que descansan este turn (pueden ser varios si N > 2*T+algo) */
  resting: string[]
}

export interface SchedulerResult {
  turns: ScheduledTurn[]
  /** Conteo final de descansos acumulados (incluye los previousRests) */
  restsByPlayer: Record<string, number>
  /** Total de matches generados (debería ser C(N,2)) */
  totalMatches: number
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

function combinationsOf2<T>(arr: T[]): [T, T][] {
  const out: [T, T][] = []
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      out.push([arr[i]!, arr[j]!])
    }
  }
  return out
}

export function schedule(input: SchedulerInput): SchedulerResult {
  const { playerIds, tables } = input
  if (tables < 1) throw new Error('tables debe ser >= 1')
  if (playerIds.length < 2) {
    return {
      turns: [],
      restsByPlayer: { ...(input.previousRests ?? {}) },
      totalMatches: 0,
    }
  }

  // Inicializar conteos
  const restsByPlayer: Record<string, number> = {}
  const pendingByPlayer: Record<string, number> = {}
  for (const id of playerIds) {
    restsByPlayer[id] = input.previousRests?.[id] ?? 0
    pendingByPlayer[id] = 0
  }

  // Todos los pares pendientes
  let pending = combinationsOf2(playerIds).map(([a, b]) => ({ a, b }))
  for (const m of pending) {
    pendingByPlayer[m.a]!++
    pendingByPlayer[m.b]!++
  }

  const turns: ScheduledTurn[] = []
  let turnNumber = 1
  const maxTurns = playerIds.length * playerIds.length // safety bound

  while (pending.length > 0 && turnNumber <= maxTurns) {
    const used = new Set<string>()
    const turnMatches: ScheduledMatch[] = []
    const playedKeys = new Set<string>()

    // Ordenar pendientes por urgencia: pares cuyos jugadores tienen más matches pendientes primero,
    // desempate: jugadores con menos descansos primero (priorizar a los que están jugando mucho).
    const sortedPending = [...pending].sort((m1, m2) => {
      const urgencia1 = pendingByPlayer[m1.a]! + pendingByPlayer[m1.b]!
      const urgencia2 = pendingByPlayer[m2.a]! + pendingByPlayer[m2.b]!
      if (urgencia1 !== urgencia2) return urgencia2 - urgencia1
      const rest1 = restsByPlayer[m1.a]! + restsByPlayer[m1.b]!
      const rest2 = restsByPlayer[m2.a]! + restsByPlayer[m2.b]!
      return rest2 - rest1
    })

    let table = 1
    for (const m of sortedPending) {
      if (turnMatches.length >= tables) break
      if (used.has(m.a) || used.has(m.b)) continue
      turnMatches.push({ player1: m.a, player2: m.b, table })
      used.add(m.a)
      used.add(m.b)
      playedKeys.add(pairKey(m.a, m.b))
      table++
    }

    if (turnMatches.length === 0) {
      // No se pudo formar un turn — defensivo, no debería pasar con pending > 0
      break
    }

    // Sacar de pending los matches programados (por clave de par, ignorando orden)
    pending = pending.filter(m => !playedKeys.has(pairKey(m.a, m.b)))
    for (const m of turnMatches) {
      pendingByPlayer[m.player1]!--
      pendingByPlayer[m.player2]!--
    }

    // Calcular jugadores que descansan en este turn:
    // los que NO entraron en used Y tienen partidos pendientes (si no tienen pendientes,
    // no necesitan descansar — su torneo "interno" ya terminó).
    const resting = playerIds.filter(p => !used.has(p) && pendingByPlayer[p]! > 0)
    for (const p of resting) restsByPlayer[p]!++

    turns.push({ turnNumber, matches: turnMatches, resting })
    turnNumber++
  }

  return {
    turns,
    restsByPlayer,
    totalMatches: turns.reduce((acc, t) => acc + t.matches.length, 0),
  }
}

/**
 * Helper: cantidad teórica de matches en una round-robin de N jugadores.
 */
export function expectedMatches(n: number): number {
  return (n * (n - 1)) / 2
}
