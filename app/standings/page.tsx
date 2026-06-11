import { getSupabaseServerClient } from '@/lib/supabase'
import { computeGroupStandings } from '@/lib/standings'

export const dynamic = 'force-dynamic'
import type { StandingsRow } from '@/lib/standings'
import StandingsClient from './StandingsClient'

export type { StandingsRow }

export type UserGroupStandings = {
  userId: string
  userName: string
  rows: StandingsRow[]
}

export type GroupStandingsData = {
  group: string
  userStandings: UserGroupStandings[]
}

type PredRow = {
  user_id: string
  game_id: string
  predicted_home: number
  predicted_away: number
  users: { id: string; name: string } | null
}

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export default async function StandingsPage() {
  const supabase = getSupabaseServerClient()

  // Fetch lock time (no gate — page is always accessible)
  const { data: lockSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'group_lock_time')
    .single() as unknown as { data: { value: string } | null }
  const lockTime = lockSetting?.value ?? null

  // Fetch group games and all group predictions
  const [gamesResult, predsResult] = await Promise.all([
    supabase
      .from('games')
      .select('id, group_name, home_team, away_team, match_number')
      .eq('stage', 'group')
      .order('match_number', { ascending: true }),
    supabase
      .from('predictions')
      .select('user_id, game_id, predicted_home, predicted_away, users(id, name)') as unknown as Promise<{
        data: PredRow[] | null
      }>,
  ])

  const allGames = gamesResult.data ?? []
  const allPreds = predsResult.data ?? []

  // Build: userId → { userName, preds: { gameId → {home,away} } }
  type UserData = { userName: string; preds: Record<string, { home: number; away: number }> }
  const userMap = new Map<string, UserData>()

  for (const pred of allPreds) {
    if (!pred.users) continue
    if (!userMap.has(pred.user_id)) {
      userMap.set(pred.user_id, { userName: pred.users.name, preds: {} })
    }
    userMap.get(pred.user_id)!.preds[pred.game_id] = {
      home: pred.predicted_home,
      away: pred.predicted_away,
    }
  }

  // Compute standings per group × user
  const groupStandingsData: GroupStandingsData[] = GROUPS.map(group => {
    const groupGames = allGames.filter(g => g.group_name === group)

    const userStandings: UserGroupStandings[] = []

    for (const [userId, userData] of userMap) {
      // Only include users who predicted at least one game in this group
      const hasAny = groupGames.some(g => userData.preds[g.id] !== undefined)
      if (!hasAny) continue

      userStandings.push({
        userId,
        userName: userData.userName,
        rows: computeGroupStandings(groupGames, userData.preds),
      })
    }

    userStandings.sort((a, b) => a.userName.localeCompare(b.userName))
    return { group, userStandings }
  })

  return <StandingsClient groupStandingsData={groupStandingsData} lockTime={lockTime} />
}
