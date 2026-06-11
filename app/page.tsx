import { getLeaderboard } from '@/lib/queries'
import HomeClient from './HomeClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const leaderboard = await getLeaderboard()
  return <HomeClient leaderboard={leaderboard} />
}
