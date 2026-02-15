'use client'

import { useState, useMemo } from 'react'
import ProtocolCard from '@/components/ProtocolCard'
import type { Bounty } from '@/lib/data/types'

const CATEGORIES = ['All', 'DeFi', 'L2 / L1', 'Bridge', 'Infrastructure', 'DEX', 'Gaming/NFT']

const SORT_OPTIONS = [
  { label: 'Highest Bounty', key: 'reward' },
  { label: 'Most Scope', key: 'scope' },
  { label: 'Newest', key: 'newest' },
] as const

export default function BountyGrid({ bounties }: { bounties: Bounty[] }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'reward' | 'scope' | 'newest'>('reward')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = bounties

    // Category filter
    if (activeFilter !== 'All') {
      list = list.filter((b) => {
        const cats = Array.isArray(b.category) ? b.category : [b.category]
        return cats.some((c) => c === activeFilter)
      })
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((b) =>
        b.name.toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q) ||
        b.chains.some(c => c.toLowerCase().includes(q))
      )
    }

    // Sort
    if (sortBy === 'reward') {
      list = [...list].sort((a, b) => (b.maxRewardNum || 0) - (a.maxRewardNum || 0))
    } else if (sortBy === 'scope') {
      list = [...list].sort((a, b) => (b.scopeCount || 0) - (a.scopeCount || 0))
    }

    return list
  }, [activeFilter, sortBy, search, bounties])

  return (
    <>
      {/* ─── SEARCH + CONTROLS ─── */}
      <div className="bg-search-bar">
        <input
          type="text"
          placeholder="Search protocols, chains, categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-search-input"
        />
        <span className="bg-result-count">{filtered.length} programs</span>
      </div>

      <div className="bg-controls">
        <div className="bfs">
          {CATEGORIES.map((f) => (
            <button
              key={f}
              type="button"
              className={`bf ${f === activeFilter ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="bg-sort">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`bg-sort-btn ${sortBy === opt.key ? 'active' : ''}`}
              onClick={() => setSortBy(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── BOUNTY CARDS ─── */}
      <div className="bg-grid">
        {filtered.map((b) => (
          <ProtocolCard key={b.id} bounty={b} />
        ))}
      </div>
    </>
  )
}
