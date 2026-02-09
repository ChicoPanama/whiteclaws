'use client'

import Link from 'next/link'
import { leaderboard } from '@/lib/data/constants'
import { LeaderboardEntry } from '@/lib/data/types'

export default function LeaderboardPreview() {
  const topFive = leaderboard.slice(0, 5)

  return (
    <div className="section">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h2 className="text-display font-bold text-3xl md:text-4xl mb-2">
              🏆 Top Whitehats
            </h2>
            <p className="text-lg text-ink-2">
              Leading security researchers by earnings
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="btn bg-surface border border-border-2 text-ink font-semibold px-6 py-3 rounded-lg hover:bg-surface-3 transition-colors inline-flex items-center gap-2"
          >
            View Full Leaderboard →
          </Link>
        </div>

        {/* Leaderboard */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="lr bg-surface-2 border-b border-border font-semibold text-sm text-dim">
            <div className="text-center">Rank</div>
            <div>Researcher</div>
            <div className="text-right">Earned</div>
          </div>

          {/* Rows */}
          <div className="ll">
            {topFive.map((entry: LeaderboardEntry) => (
              <div
                key={entry.rank}
                className="lr group hover:bg-surface-2 transition-colors"
              >
                {/* Rank */}
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    entry.rank === 1
                      ? 'bg-yellow/20 text-yellow'
                      : entry.rank === 2
                      ? 'bg-ink-2/20 text-ink-2'
                      : entry.rank === 3
                      ? 'bg-orange/20 text-orange'
                      : 'bg-dim/10 text-dim'
                  }`}>
                    {entry.rank}
                  </div>
                </div>

                {/* Researcher */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-3 border border-border-2 flex items-center justify-center text-sm font-bold text-ink">
                    {entry.initials}
                  </div>
                  <div>
                    <div className="font-semibold">{entry.name}</div>
                    <div className="text-xs text-dim">
                      {entry.rank === 1 && 'Top earner · 24 critical findings'}
                      {entry.rank === 2 && 'Flash loan specialist · 18 findings'}
                      {entry.rank === 3 && 'Reentrancy expert · 15 findings'}
                      {entry.rank === 4 && 'Oracle manipulation · 12 findings'}
                      {entry.rank === 5 && 'Gas optimization · 10 findings'}
                    </div>
                  </div>
                </div>

                {/* Earnings */}
                <div className="text-right">
                  <div className="font-mono font-bold text-lg text-green">
                    {entry.earned}
                  </div>
                  <div className="text-xs text-dim">Total Earnings</div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-surface-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-ink-2">
                <span className="text-green font-semibold">$12.8M+</span> paid out to researchers
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/leaderboard"
                  className="text-sm font-semibold text-ink-2 hover:text-ink transition-colors"
                >
                  View All Rankings →
                </Link>
                <Link
                  href="/submit"
                  className="btn bg-green text-bg font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  Submit Finding
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="text-2xl font-bold text-green font-mono mb-2">847</div>
            <div className="font-semibold mb-2">Total Findings</div>
            <div className="text-sm text-ink-2">
              Verified vulnerabilities across all programs
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="text-2xl font-bold text-green font-mono mb-2">98.2%</div>
            <div className="font-semibold mb-2">Acceptance Rate</div>
            <div className="text-sm text-ink-2">
              Of submitted findings are validated and paid
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="text-2xl font-bold text-green font-mono mb-2">24h</div>
            <div className="font-semibold mb-2">Avg. Triage Time</div>
            <div className="text-sm text-ink-2">
              From submission to validation and payout
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}