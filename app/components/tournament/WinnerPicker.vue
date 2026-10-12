<template>
  <div class="flex items-center justify-center gap-2">
    <button
      v-for="(pid, i) in [match.player1_id, match.player2_id]"
      :key="pid"
      type="button"
      class="flex items-center justify-center flex-1 min-w-0 min-h-14 gap-1.5 border-2 rounded-xl transition-all duration-150 active:scale-95 disabled:active:scale-100 px-3 py-2.5"
      :class="[
        tone === 'light'
          ? match.winner_id === pid
            ? 'border-solid border-win bg-win-soft text-win'
            : match.winner_id
              ? 'border-solid border-transparent text-muted'
              : disabled
                ? 'border-dashed border-line text-muted'
                : 'border-solid border-line text-ink'
          : match.winner_id === pid
            ? 'border-solid border-white bg-white text-mesa-700'
            : match.winner_id
              ? 'border-solid border-transparent text-mesa-200'
              : disabled
                ? 'border-dashed border-white/40 text-mesa-200'
                : 'border-solid border-white/40 text-white',
        i === 1 ? 'order-3' : '',
      ]"
      :disabled="disabled"
      @click="emit('pick', pid)"
    >
      <UIcon v-if="match.winner_id === pid" name="i-lucide-crown" class="size-4 shrink-0" />
      <span class="font-display text-lg font-bold uppercase truncate">{{ playerName(pid) }}</span>
    </button>
    <span
      class="order-2 relative shrink-0 font-display text-sm font-bold uppercase px-1"
      :class="tone === 'light' ? 'bg-surface text-muted' : 'bg-mesa-600 text-mesa-200'"
    >vs</span>
  </div>
</template>

<script setup>
defineProps({
  match: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
  tone: { type: String, default: 'mesa' },
})
const emit = defineEmits(['pick'])

const tournamentStore = useTournamentStore()

function playerName(pid) {
  return tournamentStore.players.find(p => p.id === pid)?.name ?? '?'
}
</script>
