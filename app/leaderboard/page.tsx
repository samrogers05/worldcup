import { getLeaderboard } from '@/lib/queries'
import { getSupabaseServerClient } from '@/lib/supabase'
import LeaderboardClient from './LeaderboardClient'

export default async function LeaderboardPage() {
  const supabase = getSupabaseServerClient()
  const [leaderboard, { data: lockSetting }] = await Promise.all([
    getLeaderboard(),
    supabase.from('settings').select('value').eq('key', 'group_lock_time').single(),
  ])
  const lockTime = (lockSetting as { value: string } | null)?.value ?? null
  return <LeaderboardClient leaderboard={leaderboard} lockTime={lockTime} />
}
