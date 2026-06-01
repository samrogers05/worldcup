export function computePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
): number {
  const exact = predictedHome === actualHome && predictedAway === actualAway
  if (exact) return 3

  const predictedDir = Math.sign(predictedHome - predictedAway)
  const actualDir    = Math.sign(actualHome - actualAway)
  if (predictedDir !== actualDir) return 0

  // Correct direction: 2pts for correctly calling a draw, 1pt for correct win direction
  return actualDir === 0 ? 2 : 1
}
