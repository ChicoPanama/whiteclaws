'use client'

import Link from 'next/link'
import { useState } from 'react'
import useScrollReveal from '@/components/landing/useScrollReveal'
import ProtocolIcon from '@/components/ProtocolIcon'
import type { Bounty } from '@/lib/data/types'

const filters = ['All', 'DeFi', 'L2 / L1', 'Bridge', 'Infra']

export default function BountiesPreview({ bounties }: { bounties: Bounty[] }) {
  const [activeFilter, setActiveFilter] = useState(filters[0])
  const revealRef = useScrollReveal()

  const filtered = activeFilter === 'All'
    ? bounties
    : bounties.filter((b) => {
        const target = activeFilter === 'Infra' ? 'Infrastructure' : activeFilter
        const cats = Array.isArray(b.category) ? b.category : [b.category]
        return cats.some((c) => c === target)
      })

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
            <Link key={b.id} href={`/protocols/${b.id}`} className="br ob-link-reset">
              <div className="bi">
                <ProtocolIcon name={b.name} logo_url={b.logo_url} size={36} />
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
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
