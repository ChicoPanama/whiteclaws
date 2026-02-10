'use client'

import Link from 'next/link'
import { useState } from 'react'
import useScrollReveal from '@/components/landing/useScrollReveal'
import { bounties } from '@/lib/data/constants'

const filters = ['All', 'DeFi', 'L2 / L1', 'Bridge', 'Infra']

export default function BountiesPreview() {
  const [activeFilter, setActiveFilter] = useState(filters[0])
  const revealRef = useScrollReveal()

  const filtered = activeFilter === 'All'
    ? bounties
    : bounties.filter((b) => b.category.includes(activeFilter))

  return (
    <section className="section">
      <div className="section-reveal" ref={revealRef}>
        <div className="sh">
          <span className="num">02 / 06</span>
          <h2>Active Bounties</h2>
          <Link href="/bounties" className="lk">View All {bounties.length} →</Link>
        </div>
        <div className="bfs">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`bf ${filter === activeFilter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
          <span className="bsort">Highest ↓</span>
        </div>
        <div className="bl">
          {filtered.slice(0, 6).map((b) => (
            <div key={b.id} className="br">
              <div className="bi">
                <span style={{ fontSize: 14, fontWeight: 700 }}>{b.icon}</span>
              </div>
              <div className="bn-w">
                <div className="bn">{b.name}</div>
                <div className="bt">
                  <span>{Array.isArray(b.category) ? b.category[0] : b.category}</span>
                </div>
              </div>
              <div className="brt">
                <div className="ba">{b.reward}</div>
                <div className="bc">
                  {b.chains.map((c) => (
                    <span key={c} className="bch">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
