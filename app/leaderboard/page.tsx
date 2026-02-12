import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import LeaderboardLive from './LeaderboardLive'

export const dynamic = 'force-dynamic'

export default function LeaderboardPage() {
  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>Season Leaderboard</h2>
        </div>
        <p className="sd-text">
          Top contributors ranked by security findings, platform growth, and engagement.
        </p>
        <LeaderboardLive />
      </div>
      <Footer />
    </>
  )
}
