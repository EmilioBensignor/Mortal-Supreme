/**
 * Stub manual de tipos de la DB.
 * Reemplazar por tipos autogenerados:
 *   supabase gen types typescript --project-id <REF> --schema public > types/database.ts
 */

export type TournamentFormat = 'league' | 'lightning'
export type TournamentStatus = 'setup' | 'in_progress' | 'finished' | 'abandoned'
export type RoundStatus = 'pending' | 'in_progress' | 'completed' | 'aborted'
export type TurnStatus = 'pending' | 'in_progress' | 'completed'
export type MatchType = 'regular' | 'tiebreaker' | 'extra' | 'final'
export type MatchStatus = 'pending' | 'in_progress' | 'completed'

export interface Player {
  id: string
  name: string
  normalized_name: string
  owner_user_id: string | null
  archived: boolean
  created_at: string
}

export interface Tournament {
  id: string
  name: string
  format: TournamentFormat
  target_score: number
  tables_count: number
  counts_for_history: boolean
  status: TournamentStatus
  winner_player_id: string | null
  winner_added_to_history: boolean
  owner_user_id: string | null
  created_at: string
  finished_at: string | null
}

export interface TournamentPlayer {
  tournament_id: string
  player_id: string
  points: number
  wins: number
  losses: number
  rests: number
}

export interface Round {
  id: string
  tournament_id: string
  round_number: number
  status: RoundStatus
  created_at: string
}

export interface Turn {
  id: string
  round_id: string
  turn_number: number
  resting_player_id: string | null
  status: TurnStatus
}

export interface Match {
  id: string
  tournament_id: string
  round_id: string | null
  turn_id: string | null
  player1_id: string
  player2_id: string
  winner_id: string | null
  table_number: number | null
  match_type: MatchType
  status: MatchStatus
  played_at: string | null
  created_at: string
}

export interface History {
  player_id: string
  tournaments_won: number
  updated_at: string
}

export interface PlayerStats {
  player_id: string
  name: string
  total_matches: number
  wins: number
  losses: number
  win_rate: number
  tournaments_won: number
}

export interface Database {
  public: {
    Tables: {
      players: { Row: Player; Insert: Partial<Player> & { name: string }; Update: Partial<Player> }
      tournaments: { Row: Tournament; Insert: Partial<Tournament> & { name: string; tables_count: number }; Update: Partial<Tournament> }
      tournament_players: { Row: TournamentPlayer; Insert: TournamentPlayer; Update: Partial<TournamentPlayer> }
      rounds: { Row: Round; Insert: Partial<Round> & { tournament_id: string; round_number: number }; Update: Partial<Round> }
      turns: { Row: Turn; Insert: Partial<Turn> & { round_id: string; turn_number: number }; Update: Partial<Turn> }
      matches: { Row: Match; Insert: Partial<Match> & { tournament_id: string; player1_id: string; player2_id: string }; Update: Partial<Match> }
      history: { Row: History; Insert: Partial<History> & { player_id: string }; Update: Partial<History> }
    }
    Views: {
      v_player_stats: { Row: PlayerStats }
    }
  }
}
