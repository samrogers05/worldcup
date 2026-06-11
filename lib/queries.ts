import { getSupabaseServerClient } from './supabase'
import { computePoints } from './scoring'

export type LeaderboardEntry = {
  id: string
  name: string
  groupPoints: number
  knockoutPoints: number
  points: number       // total = groupPoints + knockoutPoints
  maxPossible: number
}

type PredictionRow = {
  user_id: string
  predicted_home: number
  predicted_away: number
  games: { actual_home: number | null; actual_away: number | null; stage: string } | null
  users: { id: string; name: string } | null
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from('predictions')
    .select('user_id, predicted_home, predicted_away, games(actual_home, actual_away, stage), users(id, name)') as unknown as {
      data: PredictionRow[] | null
      error: unknown
    }

  if (error || !data) return []

  const map = new Map<string, LeaderboardEntry>()

  for (const pred of data) {
    const { user_id, predicted_home, predicted_away, games: game, users: user } = pred
    if (!user) continue

    if (!map.has(user_id)) {
      map.set(user_id, { id: user.id, name: user.name, groupPoints: 0, knockoutPoints: 0, points: 0, maxPossible: 0 })
    }
    const entry = map.get(user_id)!

    if (game?.actual_home != null && game?.actual_away != null) {
      const pts = computePoints(predicted_home, predicted_away, game.actual_home, game.actual_away)
      if (game.stage === 'group') entry.groupPoints += pts
      else entry.knockoutPoints += pts
      entry.points += pts
    } else {
      entry.maxPossible += 3  // unplayed: could still earn 3pts
    }
  }

  // maxPossible = points already earned + best case for remaining games
  for (const entry of map.values()) {
    entry.maxPossible += entry.points
  }

  return Array.from(map.values()).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
}

// ----------------------------------------------------------------
// User drill-down (browser-side — call from client components)
// ----------------------------------------------------------------

export type DrillDownRow = {
  gameId: string
  stage: string
  groupName: string | null
  homeTeam: string
  awayTeam: string
  kickoffTime: string | null
  matchNumber: number | null
  predictedHome: number
  predictedAway: number
  actualHome: number | null
  actualAway: number | null
  points: number | null  // null = not played yet
}

type DrillPredRow = {
  game_id: string
  predicted_home: number
  predicted_away: number
  games: {
    stage: string
    group_name: string | null
    home_team: string
    away_team: string
    kickoff_time: string | null
    actual_home: number | null
    actual_away: number | null
    match_number: number | null
  } | null
}

export async function getUserDrillDown(
  userId: string,
  // Pass in a Supabase browser client to avoid importing it here
  // (this function is called from client components)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<DrillDownRow[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('game_id, predicted_home, predicted_away, games(stage, group_name, home_team, away_team, kickoff_time, actual_home, actual_away, match_number)')
    .eq('user_id', userId) as unknown as { data: DrillPredRow[] | null; error: unknown }

  if (error || !data) return []

  return data
    .map(pred => {
      const g = pred.games
      if (!g) return null
      const played = g.actual_home != null && g.actual_away != null
      return {
        gameId: pred.game_id,
        stage: g.stage,
        groupName: g.group_name,
        homeTeam: g.home_team,
        awayTeam: g.away_team,
        kickoffTime: g.kickoff_time,
        matchNumber: g.match_number,
        predictedHome: pred.predicted_home,
        predictedAway: pred.predicted_away,
        actualHome: g.actual_home,
        actualAway: g.actual_away,
        points: played
          ? computePoints(pred.predicted_home, pred.predicted_away, g.actual_home!, g.actual_away!)
          : null,
      } satisfies DrillDownRow
    })
    .filter((r): r is DrillDownRow => r !== null)
    .sort((a, b) => (a.matchNumber ?? 999) - (b.matchNumber ?? 999))
}
