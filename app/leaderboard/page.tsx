import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import { leaderboard } from '@/lib/data/constants'

export default function LeaderboardPage() {
  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>Whitehat Leaderboard</h2>
        </div>
        <p className="sd-text">
          Top security researchers ranked by lifetime earnings and verified findings.
        </p>
        <div className="ll">
          {leaderboard.map((entry) => (
            <div key={entry.rank} className="lr">
              <span className={`lrk ${entry.rank === 1 ? 'gd' : entry.rank === 2 ? 'sv' : entry.rank === 3 ? 'bz' : ''}`}>
                {String(entry.rank).padStart(2, '0')}
              </span>
              <div className="lav">{entry.initials.charAt(0)}</div>
              <span className="lnm">{entry.name}</span>
              <span className="lvl">{entry.earned}</span>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
