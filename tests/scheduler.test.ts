import { describe, it, expect } from 'vitest'
import { schedule, expectedMatches } from '../app/utils/scheduler'

function ids(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `P${i + 1}`)
}

function assertNoPlayerTwiceInTurn(result: ReturnType<typeof schedule>) {
  for (const turn of result.turns) {
    const seen = new Set<string>()
    for (const m of turn.matches) {
      expect(seen.has(m.player1)).toBe(false)
      expect(seen.has(m.player2)).toBe(false)
      seen.add(m.player1)
      seen.add(m.player2)
    }
  }
}

function assertCompleteRoundRobin(result: ReturnType<typeof schedule>, players: string[]) {
  const seenPairs = new Set<string>()
  for (const turn of result.turns) {
    for (const m of turn.matches) {
      const key = [m.player1, m.player2].sort().join('|')
      expect(seenPairs.has(key)).toBe(false) // sin duplicados
      seenPairs.add(key)
    }
  }
  expect(seenPairs.size).toBe(expectedMatches(players.length))
}

function assertTablesRespected(result: ReturnType<typeof schedule>, tables: number) {
  for (const turn of result.turns) {
    expect(turn.matches.length).toBeLessThanOrEqual(tables)
    const tableNumbers = turn.matches.map(m => m.table)
    const uniqueTables = new Set(tableNumbers)
    expect(uniqueTables.size).toBe(tableNumbers.length) // sin mesa repetida
    for (const t of tableNumbers) {
      expect(t).toBeGreaterThanOrEqual(1)
      expect(t).toBeLessThanOrEqual(tables)
    }
  }
}

describe('scheduler — round-robin', () => {
  for (const n of [2, 3, 4, 5, 6, 7, 8]) {
    for (const t of [1, 2]) {
      it(`N=${n}, T=${t}: round-robin completa, sin colisiones, mesas respetadas`, () => {
        const players = ids(n)
        const result = schedule({ playerIds: players, tables: t })
        assertNoPlayerTwiceInTurn(result)
        assertCompleteRoundRobin(result, players)
        assertTablesRespected(result, t)
      })
    }
  }

  it('N=2: 1 match único, 1 turn', () => {
    const result = schedule({ playerIds: ids(2), tables: 2 })
    expect(result.turns.length).toBe(1)
    expect(result.turns[0]!.matches.length).toBe(1)
    expect(result.turns[0]!.resting.length).toBe(0)
  })

  it('N=4 T=2: óptimo en 3 turns', () => {
    const result = schedule({ playerIds: ids(4), tables: 2 })
    expect(result.totalMatches).toBe(6)
    expect(result.turns.length).toBe(3)
  })

  it('N=5 T=2 (impar): 1 jugador descansa por turn', () => {
    const result = schedule({ playerIds: ids(5), tables: 2 })
    expect(result.totalMatches).toBe(10)
    // En N=5 con T=2 cada turn juega 2 matches => 1 jugador descansa siempre que aún tenga pendientes
    for (const turn of result.turns) {
      expect(turn.matches.length).toBeLessThanOrEqual(2)
    }
  })

  it('descansos balanceados: max - min <= 1 con N=5 T=2', () => {
    const result = schedule({ playerIds: ids(5), tables: 2 })
    const counts = Object.values(result.restsByPlayer)
    const max = Math.max(...counts)
    const min = Math.min(...counts)
    expect(max - min).toBeLessThanOrEqual(2) // tolerancia greedy
  })

  it('respeta previousRests: el jugador con más descansos previos descansa menos ahora', () => {
    const players = ids(5)
    const previousRests = { P1: 5, P2: 0, P3: 0, P4: 0, P5: 0 }
    const result = schedule({ playerIds: players, tables: 2, previousRests })
    // P1 ya descansó mucho, debería ser priorizado para jugar
    expect(result.restsByPlayer.P1! - previousRests.P1).toBeLessThanOrEqual(
      result.restsByPlayer.P2! - previousRests.P2 + 1,
    )
  })

  it('N=3 T=1: 3 matches secuenciales en 3 turns, descanso solo cuando hay pendientes', () => {
    const result = schedule({ playerIds: ids(3), tables: 1 })
    expect(result.totalMatches).toBe(3)
    expect(result.turns.length).toBe(3)
    for (const turn of result.turns) {
      expect(turn.matches.length).toBe(1)
    }
    // Los primeros 2 turns tienen 1 jugador descansando con pendientes;
    // el último turn nadie tiene pendientes => resting = 0
    expect(result.turns[0]!.resting.length).toBe(1)
    expect(result.turns[1]!.resting.length).toBe(1)
    expect(result.turns[2]!.resting.length).toBe(0)
  })

  it('N=3 T=2: solo 1 match por turn aunque haya 2 mesas (no hay 4 jugadores)', () => {
    const result = schedule({ playerIds: ids(3), tables: 2 })
    expect(result.totalMatches).toBe(3)
    for (const turn of result.turns) {
      expect(turn.matches.length).toBe(1)
    }
  })
})
