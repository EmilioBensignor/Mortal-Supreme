const MESSAGES = [
  '🍕 Anda a buscar pizza',
  '💧 Hidratate, campeón',
  '📸 Sacá fotos del próximo punto',
  '🎵 Cambiá la música',
  '🧘 Meditá tu próxima jugada',
  '👑 El rey descansa',
  '🍺 Servite algo',
  '🦴 Estirá un poco',
  '📞 Llamá a tu madre',
  '🤔 Analizá al rival',
]

export function useRestMessage(seed = Date.now()) {
  const idx = Math.abs(hashCode(String(seed))) % MESSAGES.length
  return MESSAGES[idx]
}

function hashCode(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return h
}
