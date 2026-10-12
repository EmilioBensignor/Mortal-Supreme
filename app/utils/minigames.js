export const MINIGAMES = [
  { key: 'reaction', name: 'Reflejos', icon: 'i-lucide-zap', unit: 'ms', lowerIsBetter: true, description: 'Esperá el verde y tocá lo más rápido que puedas. Promedio de 3 intentos.' },
  { key: 'tapper', name: 'Metralleta', icon: 'i-lucide-pointer', unit: 'toques', lowerIsBetter: false, description: 'Tocá la pantalla todas las veces que puedas en 5 segundos.' },
  { key: 'paddle', name: 'Pelotita', icon: 'i-lucide-circle-dot', unit: 'golpes', lowerIsBetter: false, description: 'Tocá cuando la pelota esté en la zona naranja. Si tocás antes o se te cae, perdiste.' },
  { key: 'simon', name: 'Memoria', icon: 'i-lucide-brain', unit: 'nivel', lowerIsBetter: false, description: 'Repetí la secuencia de colores. Cada ronda suma uno más.' },
  { key: 'whack', name: 'Topo', icon: 'i-lucide-target', unit: 'puntos', lowerIsBetter: false, description: '15 segundos. Tocá el objetivo cuando aparece, tocar vacío resta.' },
]

export function minigameForTurn(turn) {
  if (!turn) return null
  let seed = 0
  for (const char of turn.round_id) seed = (seed + char.charCodeAt(0)) % MINIGAMES.length
  return MINIGAMES[(seed + turn.turn_number) % MINIGAMES.length]
}
