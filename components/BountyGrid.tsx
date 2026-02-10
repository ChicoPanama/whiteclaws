'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import ProtocolIcon from '@/components/ProtocolIcon'
import type { Bounty } from '@/lib/data/types'

const filters = ['All', 'DeFi', 'L2 / L1', 'Bridge', 'Infrastructure']

export default function BountyGrid({ bounties }: { bounties: Bounty[] }) {
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return bounties
    return bounties.filter((b) => {
      const cats = Array.isArray(b.category) ? b.category : [b.category]
      return cats.some((c) => c === activeFilter)
    })
  }, [activeFilter, bounties])

  return (
    <>
      <div className="bfs">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            className={`bf ${f === activeFilter ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
        <span className="bsort">Highest ↓</span>
      </div>
      <div className="bl">
        {filtered.map((b) => (
          <Link key={b.id} href={`/protocols/${b.id}`} className="br" style={{ textDecoration: 'none', color: 'inherit' }}>
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
    </>
  )
}
