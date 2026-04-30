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

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-light text-2xl font-bold">Jugadores</h1>
      <UButton color="secondary" icon="i-lucide-plus" @click="showCreate = true">
        Nuevo
      </UButton>
    </div>

    <UCard v-if="store.active.length === 0">
      <p class="text-pingpong-200 text-center">Todavía no hay jugadores. Crea el primero.</p>
    </UCard>

    <UCard v-for="p in store.active" :key="p.id">
      <div class="flex items-center justify-between gap-2">
        <div v-if="editingId === p.id" class="flex flex-1 items-center gap-2">
          <UInput v-model="editName" class="flex-1" autofocus @keyup.enter="saveEdit" />
          <UButton size="sm" icon="i-lucide-check" color="success" @click="saveEdit" />
          <UButton size="sm" icon="i-lucide-x" color="neutral" variant="ghost" @click="editingId = null" />
        </div>
        <template v-else>
          <NuxtLink :to="`/jugadores/${p.id}`" class="text-light font-semibold">
            {{ p.name }}
          </NuxtLink>
          <div class="flex items-center gap-1">
            <UButton size="xs" icon="i-lucide-pencil" variant="ghost" @click="startEdit(p.id, p.name)" />
            <UButton size="xs" icon="i-lucide-archive" variant="ghost" color="warning" @click="store.archive(p.id)" />
          </div>
        </template>
      </div>
    </UCard>

    <UModal :open="showCreate" @update:open="(v) => showCreate = v">
      <template #content>
        <div class="flex flex-col gap-4 p-6">
          <h3 class="text-light text-lg font-bold">Nuevo jugador</h3>
          <UInput v-model="newName" placeholder="Nombre" autofocus @keyup.enter="createPlayer" />
          <p v-if="error" class="text-error text-sm">{{ error }}</p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showCreate = false">Cancelar</UButton>
            <UButton color="secondary" :loading="creating" @click="createPlayer">Crear</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
