import { getSupabaseServerClient } from '@/lib/supabase'
import PredictClient from './PredictClient'

export default async function PredictPage() {
  const supabase = getSupabaseServerClient()

  const [{ data: gamesData }, { data: settingsData }] = await Promise.all([
    supabase
      .from('games')
      .select('id, group_name, home_team, away_team, kickoff_time, actual_home, actual_away, match_number')
      .eq('stage', 'group')
      .order('match_number', { ascending: true }),
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'group_lock_time')
      .single() as unknown as Promise<{ data: { value: string } | null }>,
  ])

  const games = (gamesData ?? []).map(g => ({
    id: g.id,
    group_name: g.group_name ?? '',
    home_team: g.home_team,
    away_team: g.away_team,
    kickoff_time: g.kickoff_time,
    actual_home: g.actual_home,
    actual_away: g.actual_away,
    match_number: g.match_number,
  }))

  return <PredictClient games={games} lockTime={settingsData?.value ?? null} />
}
