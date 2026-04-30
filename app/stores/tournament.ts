import { defineStore } from 'pinia'
import type { Match, Player, Round, Tournament, TournamentPlayer, Turn, TournamentFormat } from '~~/types/database'
import { schedule } from '~/utils/scheduler'

interface CreateTournamentInput {
  name: string
  format: TournamentFormat
  targetScore: number
  tablesCount: number
  countsForHistory: boolean
  playerIds: string[]
}

export const useTournamentStore = defineStore('tournament', () => {
  const supabase = useSupabaseClient()

  const tournament = ref<Tournament | null>(null)
  const tournamentPlayers = ref<TournamentPlayer[]>([])
  const players = ref<Player[]>([]) // hidratados de la lista de jugadores del torneo
  const rounds = ref<Round[]>([])
  const turns = ref<Turn[]>([])
  const matches = ref<Match[]>([])
  const loading = ref(false)

  // ----- Derivadas -----
  const currentRound = computed(() =>
    [...rounds.value]
      .sort((a, b) => b.round_number - a.round_number)
      .find(r => r.status !== 'completed' && r.status !== 'aborted')
      ?? rounds.value[rounds.value.length - 1]
      ?? null,
  )

  const currentTurns = computed<Turn[]>(() => {
    if (!currentRound.value) return []
    return turns.value
      .filter(t => t.round_id === currentRound.value!.id)
      .sort((a, b) => a.turn_number - b.turn_number)
  })

  const currentTurn = computed<Turn | null>(() => {
    return currentTurns.value.find(t => t.status !== 'completed') ?? null
  })

  const currentTurnMatches = computed<Match[]>(() => {
    if (!currentTurn.value) return []
    return matches.value
      .filter(m => m.turn_id === currentTurn.value!.id)
      .sort((a, b) => (a.table_number ?? 0) - (b.table_number ?? 0))
  })

  const restingPlayer = computed<Player | null>(() => {
    if (!currentTurn.value?.resting_player_id) return null
    return players.value.find(p => p.id === currentTurn.value!.resting_player_id) ?? null
  })

  const standings = computed(() => {
    const tps = [...tournamentPlayers.value].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.wins !== a.wins) return b.wins - a.wins
      return a.losses - b.losses
    })
    return tps.map(tp => ({
      ...tp,
      player: players.value.find(p => p.id === tp.player_id) ?? null,
    }))
  })

  // ----- Acciones -----
  async function load(tournamentId: string) {
    loading.value = true
    const [tRes, tpRes, rRes, mRes] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', tournamentId).single(),
      supabase.from('tournament_players').select('*').eq('tournament_id', tournamentId),
      supabase.from('rounds').select('*').eq('tournament_id', tournamentId).order('round_number'),
      supabase.from('matches').select('*').eq('tournament_id', tournamentId).order('created_at'),
    ])
    if (tRes.error) throw tRes.error
    tournament.value = tRes.data as Tournament
    tournamentPlayers.value = (tpRes.data ?? []) as TournamentPlayer[]
    rounds.value = (rRes.data ?? []) as Round[]
    matches.value = (mRes.data ?? []) as Match[]

    if (rounds.value.length > 0) {
      const { data: turnData } = await supabase
        .from('turns')
        .select('*')
        .in('round_id', rounds.value.map(r => r.id))
        .order('turn_number')
      turns.value = (turnData ?? []) as Turn[]
    } else {
      turns.value = []
    }

    if (tournamentPlayers.value.length > 0) {
      const { data: pData } = await supabase
        .from('players')
        .select('*')
        .in('id', tournamentPlayers.value.map(tp => tp.player_id))
      players.value = (pData ?? []) as Player[]
    } else {
      players.value = []
    }
    loading.value = false
  }

  async function createTournament(input: CreateTournamentInput): Promise<string> {
    if (input.playerIds.length < 2) throw new Error('Necesitás al menos 2 jugadores')

    const { data: t, error: tErr } = await supabase
      .from('tournaments')
      .insert({
        name: input.name,
        format: input.format,
        target_score: input.targetScore,
        tables_count: input.tablesCount,
        counts_for_history: input.countsForHistory,
        status: 'in_progress',
      })
      .select()
      .single()
    if (tErr) throw tErr
    const tournamentId = (t as Tournament).id

    const tpRows = input.playerIds.map(pid => ({
      tournament_id: tournamentId,
      player_id: pid,
      points: 0, wins: 0, losses: 0, rests: 0,
    }))
    const { error: tpErr } = await supabase.from('tournament_players').insert(tpRows)
    if (tpErr) throw tpErr

    await generateNextRound(tournamentId, 1, input.playerIds, input.tablesCount, {})

    return tournamentId
  }

  async function generateNextRound(
    tournamentId: string,
    roundNumber: number,
    playerIds: string[],
    tables: number,
    previousRests: Record<string, number>,
  ) {
    const result = schedule({ playerIds, tables, previousRests })

    const { data: round, error: rErr } = await supabase
      .from('rounds')
      .insert({
        tournament_id: tournamentId,
        round_number: roundNumber,
        status: 'in_progress',
      })
      .select()
      .single()
    if (rErr) throw rErr

    for (const turn of result.turns) {
      const { data: turnRow, error: turnErr } = await supabase
        .from('turns')
        .insert({
          round_id: (round as Round).id,
          turn_number: turn.turnNumber,
          resting_player_id: turn.resting[0] ?? null,
          status: turn.turnNumber === 1 ? 'in_progress' : 'pending',
        })
        .select()
        .single()
      if (turnErr) throw turnErr

      const matchRows = turn.matches.map(m => ({
        tournament_id: tournamentId,
        round_id: (round as Round).id,
        turn_id: (turnRow as Turn).id,
        player1_id: m.player1,
        player2_id: m.player2,
        table_number: m.table,
        match_type: 'regular' as const,
        status: 'pending' as const,
      }))
      if (matchRows.length > 0) {
        const { error: mErr } = await supabase.from('matches').insert(matchRows)
        if (mErr) throw mErr
      }
    }
  }

  async function recordWinner(matchId: string, winnerId: string) {
    const match = matches.value.find(m => m.id === matchId)
    if (!match) throw new Error('Match no encontrado')
    if (winnerId !== match.player1_id && winnerId !== match.player2_id) {
      throw new Error('El ganador debe ser uno de los jugadores del match')
    }
    const wasCompleted = match.status === 'completed'
    const previousWinner = match.winner_id
    if (wasCompleted && previousWinner === winnerId) return // no-op

    // Update match
    const { data, error } = await supabase
      .from('matches')
      .update({
        winner_id: winnerId,
        status: 'completed',
        played_at: new Date().toISOString(),
      })
      .eq('id', matchId)
      .select()
      .single()
    if (error) throw error
    const idx = matches.value.findIndex(m => m.id === matchId)
    matches.value[idx] = data as Match

    // Update tournament_players (puntos solo si match_type cuenta para liga)
    const counts = match.match_type === 'regular' || match.match_type === 'final'
    if (counts) {
      const newLoserId = winnerId === match.player1_id ? match.player2_id : match.player1_id
      if (wasCompleted && previousWinner) {
        // Revertir resultado anterior y aplicar el nuevo
        const previousLoser = previousWinner === match.player1_id ? match.player2_id : match.player1_id
        await adjustTournamentPlayer(match.tournament_id, previousWinner, { points: -1, wins: -1 })
        await adjustTournamentPlayer(match.tournament_id, previousLoser, { losses: -1 })
      }
      await adjustTournamentPlayer(match.tournament_id, winnerId, { points: +1, wins: +1 })
      await adjustTournamentPlayer(match.tournament_id, newLoserId, { losses: +1 })
    }

    // ¿Turn completo? (solo si pertenece a un turn de round)
    if (!wasCompleted) await checkAdvanceTurn(match.turn_id)
  }

  /**
   * Marcar match completado como "no jugado": revierte puntos/wins/losses y
   * deja status='pending'. No revierte el avance del turn (sería muy invasivo).
   */
  async function unrecordWinner(matchId: string) {
    const match = matches.value.find(m => m.id === matchId)
    if (!match) throw new Error('Match no encontrado')
    if (match.status !== 'completed' || !match.winner_id) return

    const counts = match.match_type === 'regular' || match.match_type === 'final'
    if (counts) {
      const loser = match.winner_id === match.player1_id ? match.player2_id : match.player1_id
      await adjustTournamentPlayer(match.tournament_id, match.winner_id, { points: -1, wins: -1 })
      await adjustTournamentPlayer(match.tournament_id, loser, { losses: -1 })
    }

    const { data, error } = await supabase
      .from('matches')
      .update({ winner_id: null, status: 'pending', played_at: null })
      .eq('id', matchId)
      .select()
      .single()
    if (error) throw error
    const idx = matches.value.findIndex(m => m.id === matchId)
    matches.value[idx] = data as Match
  }

  /**
   * Si el torneo ya está finished y se editó un resultado, recalcular el ganador
   * y revertir/agregar history si el ganador cambió.
   * Devuelve el nuevo ganador (o null si no hay líder claro).
   */
  async function resyncFinishedTournamentWinner(): Promise<string | null> {
    if (!tournament.value || tournament.value.status !== 'finished') return null
    const newLeader = standings.value[0]
    if (!newLeader?.player) return null
    const oldWinnerId = tournament.value.winner_player_id
    const newWinnerId = newLeader.player.id
    if (oldWinnerId === newWinnerId) return newWinnerId

    // Cambió el ganador. Revertir el viejo del histórico (si fue agregado) y agregar el nuevo.
    if (tournament.value.winner_added_to_history && oldWinnerId) {
      const { data: prev } = await supabase
        .from('history')
        .select('*')
        .eq('player_id', oldWinnerId)
        .maybeSingle()
      if (prev && (prev.tournaments_won as number) > 0) {
        await supabase
          .from('history')
          .update({
            tournaments_won: (prev.tournaments_won as number) - 1,
            updated_at: new Date().toISOString(),
          })
          .eq('player_id', oldWinnerId)
      }
    }

    // Sumar al nuevo ganador (si el torneo cuenta para histórico)
    const addToHistory = tournament.value.counts_for_history
    if (addToHistory) {
      const { data: existing } = await supabase
        .from('history')
        .select('*')
        .eq('player_id', newWinnerId)
        .maybeSingle()
      if (existing) {
        await supabase
          .from('history')
          .update({
            tournaments_won: (existing.tournaments_won as number) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('player_id', newWinnerId)
      } else {
        await supabase.from('history').insert({ player_id: newWinnerId, tournaments_won: 1 })
      }
    }

    await supabase
      .from('tournaments')
      .update({
        winner_player_id: newWinnerId,
        winner_added_to_history: addToHistory,
      })
      .eq('id', tournament.value.id)
    tournament.value.winner_player_id = newWinnerId
    tournament.value.winner_added_to_history = addToHistory
    return newWinnerId
  }

  async function adjustTournamentPlayer(
    tournamentId: string,
    playerId: string,
    delta: Partial<Pick<TournamentPlayer, 'points' | 'wins' | 'losses' | 'rests'>>,
  ) {
    const tp = tournamentPlayers.value.find(t => t.tournament_id === tournamentId && t.player_id === playerId)
    if (!tp) return
    const update: Partial<TournamentPlayer> = {}
    if (delta.points) update.points = tp.points + delta.points
    if (delta.wins) update.wins = tp.wins + delta.wins
    if (delta.losses) update.losses = tp.losses + delta.losses
    if (delta.rests) update.rests = tp.rests + delta.rests
    const { error } = await supabase
      .from('tournament_players')
      .update(update)
      .eq('tournament_id', tournamentId)
      .eq('player_id', playerId)
    if (error) throw error
    Object.assign(tp, update)
  }

  async function checkAdvanceTurn(turnId: string | null) {
    if (!turnId) return
    const turnMatches = matches.value.filter(m => m.turn_id === turnId)
    if (turnMatches.every(m => m.status === 'completed')) {
      await supabase.from('turns').update({ status: 'completed' }).eq('id', turnId)
      const tIdx = turns.value.findIndex(t => t.id === turnId)
      if (tIdx >= 0) turns.value[tIdx]!.status = 'completed'

      // Activar próximo turn
      const turn = turns.value[tIdx]
      if (turn) {
        const next = turns.value.find(t => t.round_id === turn.round_id && t.status === 'pending')
        if (next) {
          await supabase.from('turns').update({ status: 'in_progress' }).eq('id', next.id)
          next.status = 'in_progress'
          // Sumar descanso
          if (next.resting_player_id) {
            await adjustTournamentPlayer(turn.round_id ? tournament.value!.id : '', next.resting_player_id, { rests: +1 })
          }
        } else {
          // Round completa
          await supabase.from('rounds').update({ status: 'completed' }).eq('id', turn.round_id)
          const rIdx = rounds.value.findIndex(r => r.id === turn.round_id)
          if (rIdx >= 0) rounds.value[rIdx]!.status = 'completed'
        }
      }
    }
  }

  async function abortRound() {
    if (!currentRound.value) return
    await supabase.from('rounds').update({ status: 'aborted' }).eq('id', currentRound.value.id)
    currentRound.value.status = 'aborted'
  }

  async function startNextRound() {
    if (!tournament.value) return
    const lastNumber = Math.max(...rounds.value.map(r => r.round_number), 0)
    const previousRests: Record<string, number> = {}
    for (const tp of tournamentPlayers.value) previousRests[tp.player_id] = tp.rests
    await generateNextRound(
      tournament.value.id,
      lastNumber + 1,
      tournamentPlayers.value.map(tp => tp.player_id),
      tournament.value.tables_count,
      previousRests,
    )
    await load(tournament.value.id)
  }

  async function addExtraMatch(p1: string, p2: string, type: 'extra' | 'tiebreaker' | 'final') {
    if (!tournament.value) return
    const { data, error } = await supabase
      .from('matches')
      .insert({
        tournament_id: tournament.value.id,
        round_id: null,
        turn_id: null,
        player1_id: p1,
        player2_id: p2,
        match_type: type,
        status: 'pending',
      })
      .select()
      .single()
    if (error) throw error
    matches.value.push(data as Match)
  }

  async function finishTournament(winnerId: string, addToHistory: boolean) {
    if (!tournament.value) return
    const { error } = await supabase
      .from('tournaments')
      .update({
        status: 'finished',
        winner_player_id: winnerId,
        winner_added_to_history: addToHistory,
        finished_at: new Date().toISOString(),
      })
      .eq('id', tournament.value.id)
    if (error) throw error

    if (addToHistory) {
      const { data: existing } = await supabase
        .from('history')
        .select('*')
        .eq('player_id', winnerId)
        .maybeSingle()
      if (existing) {
        await supabase
          .from('history')
          .update({
            tournaments_won: (existing.tournaments_won as number) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('player_id', winnerId)
      } else {
        await supabase.from('history').insert({ player_id: winnerId, tournaments_won: 1 })
      }
    }
    tournament.value.status = 'finished'
    tournament.value.winner_player_id = winnerId
    tournament.value.winner_added_to_history = addToHistory
  }

  return {
    tournament, tournamentPlayers, players, rounds, turns, matches, loading,
    currentRound, currentTurn, currentTurnMatches, restingPlayer, standings,
    load, createTournament, recordWinner, unrecordWinner, resyncFinishedTournamentWinner,
    abortRound, startNextRound, addExtraMatch, finishTournament,
  }
})
