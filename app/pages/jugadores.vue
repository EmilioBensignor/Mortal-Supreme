<template>
  <div class="flex flex-col gap-5">
    <div class="flex items-center justify-between gap-3">
      <h1 class="font-display text-ink text-3xl font-extrabold uppercase leading-none">Jugadores</h1>
      <UButton color="secondary" icon="i-lucide-plus" class="font-display font-bold uppercase tracking-wider" @click="showCreate = true">
        Nuevo
      </UButton>
    </div>

    <section
      v-if="store.active.length === 0"
      class="flex flex-col items-center gap-2 bg-surface border border-solid border-line rounded-xl text-center px-6 py-10"
    >
      <UIcon name="i-lucide-users" class="size-10 text-muted" />
      <p class="text-ink text-base font-semibold">Todavía no hay jugadores</p>
      <p class="text-muted text-sm">Creá el primero para armar un torneo</p>
    </section>

    <ul v-else class="flex flex-col bg-surface border border-solid border-line rounded-xl px-4">
      <li
        v-for="p in store.active"
        :key="p.id"
        class="flex items-center justify-between gap-2 border-solid border-line not-first:border-t py-3"
      >
        <div v-if="editingId === p.id" class="flex flex-1 items-center gap-2 min-w-0">
          <UInput v-model="editName" class="flex-1 min-w-0" autofocus @keyup.enter="saveEdit" />
          <UButton size="sm" icon="i-lucide-check" color="secondary" @click="saveEdit" />
          <UButton size="sm" icon="i-lucide-x" color="neutral" variant="ghost" @click="editingId = null" />
        </div>
        <template v-else>
          <NuxtLink :to="`/jugadores/${p.id}`" class="flex-1 min-w-0 text-ink text-base font-semibold truncate active:opacity-70">
            {{ p.name }}
          </NuxtLink>
          <div class="flex items-center gap-1 shrink-0">
            <UButton size="sm" icon="i-lucide-pencil" color="neutral" variant="ghost" @click="startEdit(p.id, p.name)" />
            <UButton size="sm" icon="i-lucide-archive" color="neutral" variant="ghost" @click="store.archive(p.id)" />
          </div>
        </template>
      </li>
    </ul>

    <UModal
      :open="showCreate"
      title="Nuevo jugador"
      description="Se suma a la lista de jugadores activos."
      :ui="{ content: 'max-w-md' }"
      @update:open="(v) => showCreate = v"
    >
      <template #body>
        <div class="flex flex-col gap-3">
          <UInput v-model="newName" placeholder="Nombre" class="w-full" autofocus @keyup.enter="createPlayer" />
          <p v-if="error" class="text-error text-sm">{{ error }}</p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="outline" @click="showCreate = false">Cancelar</UButton>
          <UButton color="secondary" :loading="creating" @click="createPlayer">Crear</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
const store = usePlayersStore()
await store.fetchAll()

const newName = ref('')
const creating = ref(false)
const showCreate = ref(false)
const error = ref(null)

async function createPlayer() {
  if (!newName.value.trim()) return
  creating.value = true
  error.value = null
  try {
    await store.create(newName.value)
    newName.value = ''
    showCreate.value = false
  } catch (e) {
    error.value = e.message ?? 'Error desconocido'
  } finally {
    creating.value = false
  }
}

const editingId = ref(null)
const editName = ref('')

function startEdit(id, currentName) {
  editingId.value = id
  editName.value = currentName
}

async function saveEdit() {
  if (!editingId.value) return
  await store.rename(editingId.value, editName.value)
  editingId.value = null
}
</script>
