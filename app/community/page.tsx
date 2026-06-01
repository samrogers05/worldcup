import { getSupabaseServerClient } from '@/lib/supabase'
import CommunityClient from './CommunityClient'

export type CommunityPrediction = {
  userId: string
  userName: string
  predictedHome: number
  predictedAway: number
}

export type CommunityGame = {
  id: string
  stage: 'group' | 'R32' | 'R16' | 'QF' | 'SF' | 'F'
  group_name: string | null
  home_team: string
  away_team: string
  kickoff_time: string | null
  actual_home: number | null
  actual_away: number | null
  match_number: number | null
  predictions: CommunityPrediction[]
}

type PredRow = {
  game_id: string
  predicted_home: number
  predicted_away: number
  users: { id: string; name: string } | null
}

export default async function CommunityPage() {
  const supabase = getSupabaseServerClient()

  // Check lock
  const { data: lockSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'group_lock_time')
    .single() as unknown as { data: { value: string } | null }

  const lockTime = lockSetting?.value ?? null
  const isLocked = lockTime ? new Date() >= new Date(lockTime) : false

  if (!isLocked) {
    const unlockAt = lockTime
      ? new Date(lockTime).toLocaleString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long',
          hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
        })
      : null

    return (
      <div className="page-root">
        <header className="retro-header px-4 py-5">
          <div className="page-container">
            <a href="/" className="text-retro-muted text-[10px] uppercase tracking-widest hover:text-neon transition-colors mb-2 inline-block">← Home</a>
            <h1 className="pixel-title-sm text-retro-white">Community Predictions</h1>
          </div>
        </header>
        <div className="page-container px-4 py-20 text-center">
          <div className="text-5xl mb-6 select-none">🔒</div>
          <h2 className="pixel-title-xs text-retro-white mb-4">Not Available Yet</h2>
          <p className="text-retro-muted text-xs uppercase tracking-widest">
            Revealed after the group stage lock
          </p>
          {unlockAt && (
            <p className="text-retro-muted text-[10px] orbitron mt-3 uppercase tracking-wide">
              Available from {unlockAt}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Fetch games and predictions in parallel
  const [gamesResult, predsResult] = await Promise.all([
    supabase
      .from('games')
      .select('id, stage, group_name, home_team, away_team, kickoff_time, actual_home, actual_away, match_number')
      .order('match_number', { ascending: true }),
    supabase
      .from('predictions')
      .select('game_id, predicted_home, predicted_away, users(id, name)') as unknown as Promise<{
        data: PredRow[] | null
      }>,
  ])

  // Group predictions by game_id
  const predsByGame = new Map<string, CommunityPrediction[]>()
  for (const pred of predsResult.data ?? []) {
    if (!pred.users) continue
    const list = predsByGame.get(pred.game_id) ?? []
    list.push({
      userId: pred.users.id,
      userName: pred.users.name,
      predictedHome: pred.predicted_home,
      predictedAway: pred.predicted_away,
    })
    predsByGame.set(pred.game_id, list)
  }

  const games: CommunityGame[] = (gamesResult.data ?? []).map(g => ({
    id: g.id,
    stage: g.stage as CommunityGame['stage'],
    group_name: g.group_name,
    home_team: g.home_team,
    away_team: g.away_team,
    kickoff_time: g.kickoff_time,
    actual_home: g.actual_home,
    actual_away: g.actual_away,
    match_number: g.match_number,
    predictions: (predsByGame.get(g.id) ?? []).sort((a, b) =>
      a.userName.localeCompare(b.userName)
    ),
  }))

  return <CommunityClient games={games} />
}
