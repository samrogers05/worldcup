import { getSupabaseServerClient } from '@/lib/supabase'
import KnockoutPredictClient from './KnockoutPredictClient'

export const dynamic = 'force-dynamic'

export type KnockoutGame = {
  id: string
  stage: 'R32' | 'R16' | 'QF' | 'SF' | 'F'
  home_team: string
  away_team: string
  kickoff_time: string | null
  actual_home: number | null
  actual_away: number | null
  match_number: number | null
}

export type RoundSettings = {
  R32: boolean
  R16: boolean
  QF: boolean
  SF: boolean
  F: boolean
}

export default async function KnockoutPredictPage() {
  const supabase = getSupabaseServerClient()

  const [gamesResult, settingsResult] = await Promise.all([
    supabase
      .from('games')
      .select('id, stage, home_team, away_team, kickoff_time, actual_home, actual_away, match_number')
      .in('stage', ['R32', 'R16', 'QF', 'SF', 'F'])
      .order('match_number', { ascending: true }),
    supabase
      .from('settings')
      .select('key, value')
      .in('key', ['r32_predictions_open', 'r16_predictions_open', 'qf_predictions_open', 'sf_predictions_open', 'f_predictions_open']) as unknown as Promise<{
        data: { key: string; value: string }[] | null
      }>,
  ])

  const settingsMap = Object.fromEntries((settingsResult.data ?? []).map(r => [r.key, r.value]))

  const roundSettings: RoundSettings = {
    R32: settingsMap['r32_predictions_open'] === 'true',
    R16: settingsMap['r16_predictions_open'] === 'true',
    QF:  settingsMap['qf_predictions_open']  === 'true',
    SF:  settingsMap['sf_predictions_open']  === 'true',
    F:   settingsMap['f_predictions_open']   === 'true',
  }

  const games = (gamesResult.data ?? []) as KnockoutGame[]

  return <KnockoutPredictClient games={games} roundSettings={roundSettings} />
}
