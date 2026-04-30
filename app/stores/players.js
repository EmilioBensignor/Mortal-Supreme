import { defineStore } from 'pinia'

export const usePlayersStore = defineStore('players', () => {
  const supabase = useSupabaseClient()
  const players = ref([])
  const loading = ref(false)

  const active = computed(() => players.value.filter(p => !p.archived))

  async function fetchAll() {
    loading.value = true
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw error
    players.value = data ?? []
    loading.value = false
  }

  async function create(name) {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('El nombre no puede estar vacío')
    // Chequeo soft local (la DB tiene el unique definitivo)
    const normalized = normalize(trimmed)
    const dupe = players.value.find(p => p.normalized_name === normalized && !p.archived)
    if (dupe) throw new Error(`Ya existe un jugador llamado "${dupe.name}"`)
    const archivedDupe = players.value.find(p => p.normalized_name === normalized && p.archived)
    if (archivedDupe) {
      // desarchivar en vez de crear
      const { data, error } = await supabase
        .from('players')
        .update({ archived: false, name: trimmed })
        .eq('id', archivedDupe.id)
        .select()
        .single()
      if (error) throw error
      const idx = players.value.findIndex(p => p.id === archivedDupe.id)
      players.value[idx] = data
      return data
    }
    const { data, error } = await supabase
      .from('players')
      .insert({ name: trimmed })
      .select()
      .single()
    if (error) throw error
    players.value.push(data)
    return data
  }

  async function rename(id, name) {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('El nombre no puede estar vacío')
    const { data, error } = await supabase
      .from('players')
      .update({ name: trimmed })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const idx = players.value.findIndex(p => p.id === id)
    if (idx >= 0) players.value[idx] = data
  }

  async function archive(id) {
    const { error } = await supabase
      .from('players')
      .update({ archived: true })
      .eq('id', id)
    if (error) throw error
    const p = players.value.find(p => p.id === id)
    if (p) p.archived = true
  }

  async function unarchive(id) {
    const { error } = await supabase
      .from('players')
      .update({ archived: false })
      .eq('id', id)
    if (error) throw error
    const p = players.value.find(p => p.id === id)
    if (p) p.archived = false
  }

  return { players, active, loading, fetchAll, create, rename, archive, unarchive }
})

function normalize(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}
