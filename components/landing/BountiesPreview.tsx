'use client'

import Link from 'next/link'
import { useState } from 'react'
import { bounties } from '@/lib/data/constants'
import { Bounty } from '@/lib/data/types'

const categories = ['All', 'DeFi', 'L2 / L1', 'Infrastructure', 'Highest ↓']

export default function BountiesPreview() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [filteredBounties, setFilteredBounties] = useState<Bounty[]>(bounties.slice(0, 5))

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)

    if (category === 'All') {
      setFilteredBounties(bounties.slice(0, 5))
    } else if (category === 'Highest ↓') {
      const sorted = [...bounties]
        .sort((a, b) => {
          const aValue = parseInt((a.reward || a.maxReward || '$0').replace(/[^0-9]/g, ''))
          const bValue = parseInt((b.reward || b.maxReward || '$0').replace(/[^0-9]/g, ''))
          return bValue - aValue
        })
        .slice(0, 5)
      setFilteredBounties(sorted)
    } else {
      const filtered = bounties
        .filter(bounty => {
          const cats = Array.isArray(bounty.category) ? bounty.category : [bounty.category]
          return cats.some(cat =>
            cat.toLowerCase().includes(category.toLowerCase().replace(' ↓', ''))
          )
        })
        .slice(0, 5)
      setFilteredBounties(filtered)
    }
  }

  return (
    <div className="section bg-surface-2">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-display font-bold text-3xl md:text-4xl mb-2">
              🎯 Active Bounties
            </h2>
            <p className="text-lg text-ink-2">
              156 live programs · $42M+ in rewards
            </p>
          </div>
          <Link
            href="/bounties"
            className="btn bg-surface border border-border-2 text-ink font-semibold px-6 py-3 rounded-lg hover:bg-surface-3 transition-colors inline-flex items-center gap-2"
          >
            View All Bounties →
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="bfs mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`pill px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === category
                  ? 'bg-green text-bg'
                  : 'bg-surface border border-border text-ink-2 hover:text-ink hover:border-border-2'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Bounty List */}
        <div className="bl">
          {filteredBounties.map((bounty, index) => (
            <Link
              key={bounty.id}
              href={`/bounties/${bounty.id}`}
              className="br group animate-slideUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-surface border border-border-2 flex items-center justify-center text-lg font-bold text-ink group-hover:border-green-mid transition-colors">
                {bounty.icon || bounty.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg truncate">{bounty.name}</h3>
                  <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
                </div>
                <div className="flex items-center gap-3 text-sm text-dim">
                  <span>{Array.isArray(bounty.category) ? bounty.category.join(', ') : bounty.category}</span>
                  <span>·</span>
                  <span>{bounty.chains.join(', ')}</span>
                </div>
              </div>

              {/* Reward */}
              <div className="text-right">
                <div className="font-mono font-bold text-xl text-green mb-1">
                  {bounty.reward}
                </div>
                <div className="text-xs text-dim">Max Reward</div>
              </div>

              {/* Arrow */}
              <div className="text-dim group-hover:text-green transition-colors">
                →
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green font-mono">$1M+</div>
              <div className="text-sm text-dim">Average Bounty</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green font-mono">24h</div>
              <div className="text-sm text-dim">Average Response</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green font-mono">98%</div>
              <div className="text-sm text-dim">Payout Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green font-mono">100+</div>
              <div className="text-sm text-dim">Chains Supported</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}