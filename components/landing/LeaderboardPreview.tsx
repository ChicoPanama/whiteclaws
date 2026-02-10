'use client'

import Link from 'next/link'
import useScrollReveal from '@/components/landing/useScrollReveal'
import { leaderboard } from '@/lib/data/constants'

export default function LeaderboardPreview() {
  const revealRef = useScrollReveal()

  return (
    <section className="section">
      <div className="section-reveal" ref={revealRef}>
        <div className="sh">
          <span className="num">03 / 06</span>
          <h2>Top Whitehats</h2>
          <Link href="/leaderboard" className="lk">Full Leaderboard →</Link>
        </div>
        <div className="ll">
          {leaderboard.slice(0, 5).map((entry) => (
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
    </section>
  )
}
