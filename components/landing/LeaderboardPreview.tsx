'use client'

import Link from 'next/link'
import useScrollReveal from '@/components/landing/useScrollReveal'

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
          <div className="lr">
            <span className="lrk gd">01</span>
            <div className="lav">P</div>
            <span className="lnm">pwned_admin</span>
            <span className="lvl">$2.8M</span>
          </div>
          <div className="lr">
            <span className="lrk sv">02</span>
            <div className="lav">0</div>
            <span className="lnm">0xshadow</span>
            <span className="lvl">$1.9M</span>
          </div>
          <div className="lr">
            <span className="lrk bz">03</span>
            <div className="lav">R</div>
            <span className="lnm">reentrancy_q</span>
            <span className="lvl">$1.4M</span>
          </div>
          <div className="lr">
            <span className="lrk">04</span>
            <div className="lav">D</div>
            <span className="lnm">defi_doctor</span>
            <span className="lvl">$987K</span>
          </div>
          <div className="lr">
            <span className="lrk">05</span>
            <div className="lav">F</div>
            <span className="lnm">flash_fury</span>
            <span className="lvl">$845K</span>
          </div>
        </div>
      </div>
    </section>
  )
}
