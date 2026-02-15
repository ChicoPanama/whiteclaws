'use client'

import Link from 'next/link'
import ProtocolIcon from './ProtocolIcon'
import type { Bounty } from '@/lib/data/types'

interface ProtocolCardProps {
  bounty: Bounty
}

function formatReward(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

export default function ProtocolCard({ bounty }: ProtocolCardProps) {
  const cats = Array.isArray(bounty.category) ? bounty.category : [bounty.category]
  const maxChains = 4
  const visibleChains = bounty.chains.slice(0, maxChains)
  const extraChains = bounty.chains.length - maxChains

  return (
    <Link
      href={`/bounties/${bounty.id}`}
      className="block bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group relative overflow-hidden"
    >
      {/* Scan line effect on hover */}
      <span className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--green)] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-lg bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0">
          <ProtocolIcon name={bounty.name} logo_url={bounty.logo_url} size={44} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{bounty.name}</h3>
          <p className="text-sm text-[var(--muted)]">{cats[0]}</p>
        </div>
        <div className="text-right">
          <span className="block text-xs text-[var(--muted)] uppercase tracking-wider">Max</span>
          <span className="font-mono text-xl font-bold text-[var(--green)]">
            {formatReward(bounty.maxRewardNum || 0)}
          </span>
        </div>
      </div>

      {/* Chains */}
      <div className="flex flex-wrap gap-2 mb-4">
        {visibleChains.map((chain) => (
          <span
            key={chain}
            className="px-2.5 py-1 bg-[var(--surface-2)] rounded-full text-xs text-[var(--muted)] font-mono"
          >
            {chain}
          </span>
        ))}
        {extraChains > 0 && (
          <span className="px-2.5 py-1 bg-[var(--surface-2)] rounded-full text-xs text-[var(--muted)] font-mono">
            +{extraChains}
          </span>
        )}
      </div>

      {/* Description */}
      {bounty.description && (
        <p className="text-sm text-[var(--ink-2)] line-clamp-2 mb-4">
          {bounty.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--muted)] font-mono">
          {bounty.scopeCount || 0} contracts
        </span>
        <span className="text-sm font-semibold text-[var(--green)] flex items-center gap-1 group-hover:gap-2 transition-all">
          Hunt →
        </span>
      </div>
    </Link>
  )
}
