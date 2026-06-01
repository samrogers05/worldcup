export function computePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
): number {
  let pts = 0
  // 1pt for correct result direction (win/draw/loss)
  if (Math.sign(predictedHome - predictedAway) === Math.sign(actualHome - actualAway)) pts++
  // 1pt for exact score
  if (predictedHome === actualHome && predictedAway === actualAway) pts++
  return pts
}
