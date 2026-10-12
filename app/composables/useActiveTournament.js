export function useActiveTournament() {
  const supabase = useSupabaseClient()
  const activeTournament = useState('tournament:active', () => null)

  async function refresh() {
    const { data } = await supabase
      .from('tournaments')
      .select('id, name')
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    activeTournament.value = data ?? null
  }

  return { activeTournament, refresh }
}
