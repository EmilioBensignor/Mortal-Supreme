export function useMinigameScores() {
  const supabase = useSupabaseClient()
  const scores = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function load(game) {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('minigame_scores')
      .select('id, score, player_id, player:players!player_id(name)')
      .eq('game', game.key)
      .order('score', { ascending: game.lowerIsBetter })
      .order('created_at', { ascending: true })
      .limit(3)
    if (err) error.value = err.message
    else scores.value = data || []
    loading.value = false
  }

  async function save({ game, playerId, tournamentId, score }) {
    error.value = null
    const { data, error: err } = await supabase
      .from('minigame_scores')
      .insert({ game: game.key, player_id: playerId, tournament_id: tournamentId, score })
      .select('id')
      .single()
    if (err) {
      error.value = err.message
      throw err
    }
    return data.id
  }

  return { scores, loading, error, load, save }
}
