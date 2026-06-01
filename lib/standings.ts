export type StandingsRow = {
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  pts: number
}

/**
 * Compute predicted group standings from a user's predictions.
 * predMap: gameId → { home, away }
 * Teams with no predictions for their games still appear, with zeros.
 */
export function computeGroupStandings(
  games: { id: string; home_team: string; away_team: string }[],
  predMap: Record<string, { home: number; away: number }>,
): StandingsRow[] {
  const rows = new Map<string, StandingsRow>()

  for (const game of games) {
    for (const team of [game.home_team, game.away_team]) {
      if (!rows.has(team)) {
        rows.set(team, { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 })
      }
    }
  }

  for (const game of games) {
    const pred = predMap[game.id]
    if (!pred) continue

    const h = rows.get(game.home_team)!
    const a = rows.get(game.away_team)!

    h.played++; a.played++
    h.gf += pred.home; h.ga += pred.away
    a.gf += pred.away; a.ga += pred.home
    h.gd = h.gf - h.ga
    a.gd = a.gf - a.ga

    if (pred.home > pred.away) {
      h.won++; h.pts += 3; a.lost++
    } else if (pred.home < pred.away) {
      a.won++; a.pts += 3; h.lost++
    } else {
      h.drawn++; h.pts++
      a.drawn++; a.pts++
    }
  }

  return Array.from(rows.values()).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.team.localeCompare(b.team)
  })
}
