'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import ProtocolIcon from '@/components/ProtocolIcon'
import type { Bounty } from '@/lib/data/types'

const CATEGORIES = ['All', 'DeFi', 'L2 / L1', 'Bridge', 'Infrastructure', 'DEX', 'Gaming/NFT']

const SORT_OPTIONS = [
  { label: 'Highest Bounty', key: 'reward' },
  { label: 'Most Scope', key: 'scope' },
  { label: 'Newest', key: 'newest' },
] as const

function formatReward(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

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
        {filtered.map((b) => {
          const cats = Array.isArray(b.category) ? b.category : [b.category]
          const maxChains = 4
          const visibleChains = b.chains.slice(0, maxChains)
          const extraChains = b.chains.length - maxChains

	          return (
	            <Link
	              key={b.id}
	              href={`/protocols/${b.id}`}
	              className="bg-card ob-link-reset"
	            >
              {/* Header */}
              <div className="bg-card-head">
                <div className="bg-card-icon">
                  <ProtocolIcon name={b.name} logo_url={b.logo_url} size={40} />
                </div>
                <div className="bg-card-title">
                  <span className="bg-card-name">{b.name}</span>
                  <span className="bg-card-cat">{cats[0]}</span>
                </div>
                <div className="bg-card-reward">
                  <span className="bg-card-reward-label">Max Bounty</span>
                  <span className="bg-card-reward-value">
                    {formatReward(b.maxRewardNum || 0)}
                  </span>
                </div>
              </div>

              {/* Description */}
              {b.description && (
                <p className="bg-card-desc">
                  {b.description.length > 120
                    ? b.description.slice(0, 120) + '…'
                    : b.description}
                </p>
              )}

              {/* Severity mini-bar */}
              {(b.severityMax || b.severityHigh) ? (
                <div className="bg-card-sev">
                  <div className="bg-sev-row">
                    <span className="bg-sev-dot critical" />
                    <span className="bg-sev-label">Critical</span>
                    <span className="bg-sev-val">{formatReward(b.severityMax || 0)}</span>
                  </div>
                  {b.severityHigh ? (
                    <div className="bg-sev-row">
                      <span className="bg-sev-dot high" />
                      <span className="bg-sev-label">High</span>
                      <span className="bg-sev-val">{formatReward(b.severityHigh || 0)}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Badges */}
              <div className="bg-card-badges">
                {visibleChains.map((c) => (
                  <span key={c} className="bg-badge chain">{c}</span>
                ))}
                {extraChains > 0 && (
                  <span className="bg-badge chain">+{extraChains}</span>
                )}
                {b.kycRequired && <span className="bg-badge kyc">KYC</span>}
                {b.pocRequired && <span className="bg-badge poc">PoC</span>}
                {b.triaged && <span className="bg-badge triaged">Triaged</span>}
                <span className="bg-badge token">{b.payoutToken || 'USDC'}</span>
              </div>

              {/* Footer stats */}
              <div className="bg-card-footer">
                {b.scopeCount ? (
                  <span className="bg-card-stat">{b.scopeCount} scope items</span>
                ) : null}
                {b.contractCount ? (
                  <span className="bg-card-stat">{b.contractCount} contracts</span>
                ) : null}
                <span className="bg-card-stat">{b.liveSince}</span>
                <span className="bg-card-arrow">View Program →</span>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
