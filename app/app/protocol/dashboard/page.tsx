'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardData {
  protocol: { slug: string; name: string } | null
  program_status: string
  stats: {
    total_findings: number
    accepted_findings: number
    paid_findings: number
    total_paid: number
    avg_response_hours: number | null
    payout_currency: string
  }
}

export default function ProtocolDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [slug, setSlug] = useState('')
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('wc_protocol_slug')
    const key = localStorage.getItem('wc_protocol_api_key')
    if (stored) setSlug(stored)
    if (key) setApiKey(key)
  }, [])

  const loadDashboard = async () => {
    if (!slug) return
    setLoading(true)
    try {
      const res = await fetch(`/api/protocols/${slug}/stats`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        localStorage.setItem('wc_protocol_slug', slug)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) loadDashboard()
  }, [slug])

  if (!slug) {
    return (
      <div className="ap-content">
        <div className="ap-page-header">
          <h1 className="ap-page-title">Protocol Dashboard</h1>
          <p className="ap-page-desc">Enter your protocol slug to view your dashboard.</p>
        </div>
        <div className="ap-card">
          <div className="ap-field">
            <label className="ap-field-label">Protocol Slug</label>
            <input type="text" className="ap-field-input" placeholder="my-protocol" onKeyDown={(e) => { if (e.key === 'Enter') setSlug((e.target as HTMLInputElement).value) }} />
          </div>
          <div className="ap-field">
            <label className="ap-field-label">API Key (stored locally)</label>
            <input type="password" className="ap-field-input" placeholder="wc_xxxx_..." onChange={(e) => { setApiKey(e.target.value); localStorage.setItem('wc_protocol_api_key', e.target.value) }} />
          </div>
          <div className="ap-field-actions">
            <button onClick={() => { const input = document.querySelector<HTMLInputElement>('.ap-field-input'); if (input?.value) setSlug(input.value) }} className="ap-btn-primary">Load Dashboard</button>
          </div>
        </div>
        <div className="ap-card" style={{ marginTop: '16px' }}>
          <p className="ap-card-text">Don&apos;t have a protocol yet?</p>
          <Link href="/app/protocol/register" className="ap-btn-primary" style={{ display: 'inline-block', marginTop: '8px' }}>Register Protocol</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="ap-content">
      <div className="ap-page-header">
        <h1 className="ap-page-title">{data?.protocol?.name || slug} Dashboard</h1>
        <p className="ap-page-desc">
          Program status: <strong>{data?.program_status || 'loading...'}</strong>
        </p>
      </div>

      <div className="ap-stat-grid">
        <div className="ap-stat-card">
          <p className="ap-stat-label">Total Findings</p>
          <p className="ap-stat-value">{loading ? '...' : data?.stats.total_findings || 0}</p>
        </div>
        <div className="ap-stat-card">
          <p className="ap-stat-label">Accepted</p>
          <p className="ap-stat-value">{loading ? '...' : data?.stats.accepted_findings || 0}</p>
        </div>
        <div className="ap-stat-card">
          <p className="ap-stat-label">Paid Out</p>
          <p className="ap-stat-value">{loading ? '...' : `$${(data?.stats.total_paid || 0).toLocaleString()}`}</p>
        </div>
        <div className="ap-stat-card">
          <p className="ap-stat-label">Avg Response</p>
          <p className="ap-stat-value">{loading ? '...' : data?.stats.avg_response_hours ? `${data.stats.avg_response_hours}h` : 'N/A'}</p>
        </div>
      </div>

      <div className="ap-section">
        <h2 className="ap-section-title">Manage</h2>
        <div className="ap-action-grid">
          <Link href="/app/protocol/findings" className="ap-action-card">
            <span className="ap-action-label">Triage Findings</span>
            <span className="ap-action-arrow">→</span>
          </Link>
          <Link href="/app/protocol/scope" className="ap-action-card">
            <span className="ap-action-label">Manage Scope</span>
            <span className="ap-action-arrow">→</span>
          </Link>
          <Link href="/app/protocol/payouts" className="ap-action-card">
            <span className="ap-action-label">Payouts</span>
            <span className="ap-action-arrow">→</span>
          </Link>
          <Link href="/app/protocol/settings" className="ap-action-card">
            <span className="ap-action-label">Settings</span>
            <span className="ap-action-arrow">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
