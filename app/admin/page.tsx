import { getSupabaseServerClient } from '@/lib/supabase'
import AdminClient from './AdminClient'

export type AdminGame = {
  id: string
  stage: 'group' | 'R32' | 'R16' | 'QF' | 'SF' | 'F'
  group_name: string | null
  home_team: string
  away_team: string
  kickoff_time: string | null
  actual_home: number | null
  actual_away: number | null
  match_number: number | null
}

export type AdminUser = {
  id: string
  name: string
  created_at: string
  predictionCount: number
}

export type AdminSettings = {
  group_lock_time: string
  r32_predictions_open: boolean
  r16_predictions_open: boolean
  qf_predictions_open: boolean
  sf_predictions_open: boolean
  f_predictions_open: boolean
  passwordIsSet: boolean
}

export default async function AdminPage() {
  const supabase = getSupabaseServerClient()

  const [gamesResult, usersResult, predsResult, settingsResult] = await Promise.all([
    supabase
      .from('games')
      .select('id, stage, group_name, home_team, away_team, kickoff_time, actual_home, actual_away, match_number')
      .order('match_number', { ascending: true }),
    supabase.from('users').select('id, name, created_at').order('created_at', { ascending: true }),
    supabase.from('predictions').select('user_id'),
    supabase.from('settings').select('key, value') as unknown as Promise<{
      data: { key: string; value: string }[] | null
    }>,
  ])

  const predCountMap: Record<string, number> = {}
  for (const p of predsResult.data ?? []) {
    predCountMap[p.user_id] = (predCountMap[p.user_id] ?? 0) + 1
  }

  const settingsMap = Object.fromEntries((settingsResult.data ?? []).map(r => [r.key, r.value]))

  const settings: AdminSettings = {
    group_lock_time: settingsMap['group_lock_time'] ?? '',
    r32_predictions_open: settingsMap['r32_predictions_open'] === 'true',
    r16_predictions_open: settingsMap['r16_predictions_open'] === 'true',
    qf_predictions_open: settingsMap['qf_predictions_open'] === 'true',
    sf_predictions_open: settingsMap['sf_predictions_open'] === 'true',
    f_predictions_open: settingsMap['f_predictions_open'] === 'true',
    passwordIsSet: !!settingsMap['admin_password_hash'],
  }

  return (
    <AdminClient
      games={(gamesResult.data ?? []) as AdminGame[]}
      users={(usersResult.data ?? []).map(u => ({
        ...u,
        predictionCount: predCountMap[u.id] ?? 0,
      }))}
      settings={settings}
    />
  )
}
