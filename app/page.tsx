import { getLeaderboard } from '@/lib/queries'
import HomeClient from './HomeClient'

export default async function Home() {
  const leaderboard = await getLeaderboard()
  return <HomeClient leaderboard={leaderboard} />
}
