'use client'

import { useState, useMemo } from 'react'
import type { Hero } from '@/lib/types/heroes'
import HeroCard from './HeroCard'
import { useAuth } from '@/hooks/useAuth'

interface WallOfHeroesProps {
  heroes: Hero[]
  stats: {
    heroCount: number
    totalEarned: number
    totalBugs: number
    totalEarnedDisplay: string
    totalBugsDisplay: string
  }
}

type SortKey = 'rank' | 'earned' | 'bugs'
type FilterKey = 'all' | 'x_verified' | 'has_pfp'

export default function WallOfHeroes({ heroes, stats }: WallOfHeroesProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('rank')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [showAll, setShowAll] = useState(false)

  // Detect if current user is a hero
  // Match by Supabase user_metadata twitter handle or email prefix
  const currentUserHandle = useMemo(() => {
    if (!user) return null
    const meta = user.user_metadata
    // Twitter OAuth stores handle in preferred_username or user_name
    const twitterHandle = meta?.preferred_username || meta?.user_name
    if (twitterHandle) {
      // Find hero whose x_handle matches
      const match = heroes.find(
        (h) => h.links.x_handle?.toLowerCase() === twitterHandle.toLowerCase()
      )
      if (match) return match.handle
    }
    // Also try matching by handle directly from display name
    const displayName = meta?.full_name || meta?.name
    if (displayName) {
      const match = heroes.find(
        (h) => h.handle.toLowerCase() === displayName.toLowerCase()
      )
      if (match) return match.handle
    }
    return null
  }, [user, heroes])

  const top3 = heroes.slice(0, 3)

  const filtered = useMemo(() => {
    let result = heroes.slice(3) // Skip top 3 (featured separately)

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (h) =>
          h.handle.toLowerCase().includes(q) ||
          (h.links.x_handle && h.links.x_handle.toLowerCase().includes(q)) ||
          (h.bio_text && h.bio_text.toLowerCase().includes(q))
      )
    }

    // Filter
    if (filter === 'x_verified') {
      result = result.filter((h) => h.links.x_handle)
    } else if (filter === 'has_pfp') {
      result = result.filter((h) => h.has_custom_pfp)
    }

    // Sort
    if (sort === 'earned') {
      result.sort((a, b) => (b.total_earned_usd || 0) - (a.total_earned_usd || 0))
    } else if (sort === 'bugs') {
      result.sort((a, b) => (b.bugs_found || 0) - (a.bugs_found || 0))
    } else {
      result.sort((a, b) => (a.rank || 999) - (b.rank || 999))
    }

    return result
  }, [heroes, search, sort, filter])

  const visible = showAll ? filtered : filtered.slice(0, 21)

  return (
    <div className="hw-wrap">
      {/* Hero banner stats */}
      <div className="hw-banner">
        <div className="hw-stat-row">
          <div className="hw-big-stat">
            <span className="hw-big-num">{stats.heroCount}</span>
            <span className="hw-big-lbl">Whitehats</span>
          </div>
          <div className="hw-big-divider" />
          <div className="hw-big-stat">
            <span className="hw-big-num">{stats.totalEarnedDisplay}</span>
            <span className="hw-big-lbl">Earned Protecting DeFi</span>
          </div>
          <div className="hw-big-divider" />
          <div className="hw-big-stat">
            <span className="hw-big-num">{stats.totalBugsDisplay}</span>
            <span className="hw-big-lbl">Vulnerabilities Found</span>
          </div>
        </div>
      </div>

      {/* Logged-in hero callout */}
      {currentUserHandle && (
        <div className="hw-king-banner">
          <span className="hw-king-emoji">👑</span>
          <span>Welcome back, <strong>{currentUserHandle}</strong>. You're on the Wall.</span>
        </div>
      )}

      {/* Top 3 featured */}
      <div className="hw-podium">
        <h3 className="hw-section-title">Top Whitehats</h3>
        <div className="hw-featured">
          {top3.map((hero) => (
            <HeroCard
              key={hero.handle}
              hero={hero}
              featured
              isCurrentUser={currentUserHandle === hero.handle}
            />
          ))}
        </div>
      </div>

      {/* Search + filters */}
      <div className="hw-controls">
        <div className="hw-search">
          <span className="hw-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search heroes..."
            className="hw-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="hw-search-clear" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>
        <div className="hw-filters">
          <div className="hw-filter-group">
            {(['all', 'x_verified', 'has_pfp'] as FilterKey[]).map((f) => (
              <button
                key={f}
                className={`hw-filter ${filter === f ? 'hw-filter-active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'x_verified' ? '𝕏 Verified' : 'With Avatar'}
              </button>
            ))}
          </div>
          <div className="hw-sort-group">
            {(['rank', 'earned', 'bugs'] as SortKey[]).map((s) => (
              <button
                key={s}
                className={`hw-sort ${sort === s ? 'hw-sort-active' : ''}`}
                onClick={() => setSort(s)}
              >
                {s === 'rank' ? 'Rank' : s === 'earned' ? 'Earnings' : 'Bugs Found'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="hw-grid">
        {visible.map((hero) => (
          <HeroCard
            key={hero.handle}
            hero={hero}
            isCurrentUser={currentUserHandle === hero.handle}
          />
        ))}
      </div>

      {/* Show more */}
      {!showAll && filtered.length > 21 && (
        <div className="hw-more">
          <button className="hw-more-btn" onClick={() => setShowAll(true)}>
            Show all {filtered.length} heroes
          </button>
        </div>
      )}

      {/* Empty state */}
      {visible.length === 0 && (
        <div className="hw-empty">
          <span className="hw-empty-icon">🔍</span>
          <p>No heroes match your search.</p>
        </div>
      )}

      {/* Attribution */}
      <div className="hw-attr">
        <span>Data sourced from </span>
        <a href="https://immunefi.com/hacker-pledging/" target="_blank" rel="noopener noreferrer">
          Immunefi Hacker Pledging
        </a>
        <span> · {stats.heroCount} whitehats · Updated {new Date().toLocaleDateString()}</span>
      </div>
    </div>
  )
}
