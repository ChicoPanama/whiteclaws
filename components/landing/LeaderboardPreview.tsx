'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import useScrollReveal from '@/components/landing/useScrollReveal'

interface LeaderboardEntry {
  rank: number
  name: string
  handle: string
  initials: string
  earned: string
  earnedNum: number
  submissions: number
  accepted: number
  points: number
}

interface LeaderboardMeta {
  totalBounties: number
  totalEarned: string
  activeResearchers: number
  season: string
}

export default function LeaderboardPreview() {
  const revealRef = useScrollReveal()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [meta, setMeta] = useState<LeaderboardMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard')
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        if (!mounted) return

        if (json.success && json.data) {
          setEntries(json.data.entries?.slice(0, 5) || [])
          setMeta(json.data.metadata || null)
          setLastUpdated(json.timestamp || new Date().toISOString())
        }
      } catch {
        // Silent fail — show empty state
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchLeaderboard()
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchLeaderboard, 300_000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  const hasData = entries.length > 0

  return (
    <section className="section">
      <div className="section-reveal" ref={revealRef}>
        <div className="sh">
          <span className="num">03 / 06</span>
          <h2>Top Researchers</h2>
          <Link href="/leaderboard" className="lk">Full Leaderboard →</Link>
        </div>

        {meta && hasData && (
          <div className="lb-meta">
            <div className="lb-meta-item">
              <span className="lb-meta-val">{meta.totalEarned}</span>
              <span className="lb-meta-label">Total Earned</span>
            </div>
            <div className="lb-meta-item">
              <span className="lb-meta-val">{meta.activeResearchers}</span>
              <span className="lb-meta-label">Active Researchers</span>
            </div>
            <div className="lb-meta-item">
              <span className="lb-meta-val">{meta.season}</span>
              <span className="lb-meta-label">Current Season</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="lb-loading">
            <div className="lb-pulse" />
            <span>Loading rankings...</span>
          </div>
        ) : hasData ? (
          <div className="ll">
            {entries.map((entry) => (
              <div key={entry.rank} className="lr">
                <span className={`lrk ${entry.rank === 1 ? 'gd' : entry.rank === 2 ? 'sv' : entry.rank === 3 ? 'bz' : ''}`}>
                  {String(entry.rank).padStart(2, '0')}
                </span>
                <div className="lav">{entry.initials.charAt(0)}</div>
                <div className="lr-info">
                  <span className="lnm">{entry.name}</span>
                  {entry.handle && <span className="lr-handle">@{entry.handle}</span>}
                </div>
                <div className="lr-stats">
                  {entry.accepted > 0 && (
                    <span className="lr-stat">
                      <span className="lr-stat-val">{entry.accepted}</span>
                      <span className="lr-stat-label">accepted</span>
                    </span>
                  )}
                  {entry.submissions > 0 && (
                    <span className="lr-stat">
                      <span className="lr-stat-val">{entry.submissions}</span>
                      <span className="lr-stat-label">submitted</span>
                    </span>
                  )}
                </div>
                <span className="lvl">{entry.earned}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="lb-empty">
            <div className="lb-empty-icon">🦞</div>
            <p className="lb-empty-title">Season 1 — Rankings Open</p>
            <p className="lb-empty-text">
              No accepted findings yet. The first researcher to get a finding
              accepted claims the #1 spot. Rankings update live as findings
              move through the lifecycle.
            </p>
            <div className="lb-empty-ctas">
              <Link href="/start/researcher" className="btn btn-w btn-sm">Start Hunting →</Link>
              <Link href="/start/agent" className="btn btn-g btn-sm">Deploy an Agent →</Link>
            </div>
          </div>
        )}

        {lastUpdated && hasData && (
          <div className="lb-footer">
            <span className="lb-live-dot" />
            Live — updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </section>
  )
}
