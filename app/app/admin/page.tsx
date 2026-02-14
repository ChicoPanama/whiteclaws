'use client'

import { useCallback, useMemo, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'

type SybilFlag = {
  id?: string
  wallet_address: string
  risk_score: number
  reviewed?: boolean
  reviewed_by?: string | null
  updated_at?: string
  created_at?: string
}

export default function AdminPage() {
  const [adminApiKey, setAdminApiKey] = useState('')
  const [adminSecret, setAdminSecret] = useState('')

  const [sybilFlags, setSybilFlags] = useState<SybilFlag[]>([])
  const [sybilLoading, setSybilLoading] = useState(false)
  const [sybilError, setSybilError] = useState<string | null>(null)

  const [wallet, setWallet] = useState('')
  const [decision, setDecision] = useState<'approve' | 'reject' | 'flag'>('flag')
  const [reviewer, setReviewer] = useState('admin')
  const [reviewResult, setReviewResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [reviewing, setReviewing] = useState(false)

  const authHeaderApiKey = useMemo(() => {
    return adminApiKey.trim() ? ({ Authorization: `Bearer ${adminApiKey.trim()}` } as HeadersInit) : undefined
  }, [adminApiKey])

  const authHeaderSecret = useMemo(() => {
    return adminSecret.trim() ? ({ Authorization: `Bearer ${adminSecret.trim()}` } as HeadersInit) : undefined
  }, [adminSecret])

  const loadSybilFlags = useCallback(async () => {
    setSybilLoading(true)
    setSybilError(null)
    try {
      const res = await fetch('/api/admin/sybil/flags?min_score=0.2&reviewed=false&limit=50', {
        headers: authHeaderApiKey,
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSybilError(body?.error || 'Failed to load flags')
        setSybilFlags([])
        return
      }
      setSybilFlags((body?.flags || []) as SybilFlag[])
    } catch {
      setSybilError('Failed to load flags')
      setSybilFlags([])
    } finally {
      setSybilLoading(false)
    }
  }, [authHeaderApiKey])

  const submitReview = useCallback(async () => {
    if (!wallet.trim() || reviewing) return
    setReviewing(true)
    setReviewResult(null)
    try {
      const res = await fetch('/api/admin/sybil/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaderApiKey || {}),
        },
        body: JSON.stringify({
          wallet_address: wallet.trim(),
          decision,
          reviewer: reviewer.trim() || 'admin',
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setReviewResult({ ok: false, message: body?.error || 'Review failed' })
        return
      }
      setReviewResult({ ok: true, message: `Reviewed ${wallet.trim()} as ${decision}` })
      loadSybilFlags()
    } finally {
      setReviewing(false)
    }
  }, [wallet, reviewing, decision, reviewer, authHeaderApiKey, loadSybilFlags])

  const runCron = useCallback(async (path: string, body?: any) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeaderSecret || {}),
      },
      body: body ? JSON.stringify(body) : '{}',
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, data }
  }, [authHeaderSecret])

  const [cronResult, setCronResult] = useState<{ ok: boolean; message: string; data?: any } | null>(null)
  const [cronRunning, setCronRunning] = useState(false)

  const runWeekly = useCallback(async () => {
    setCronRunning(true)
    setCronResult(null)
    try {
      const r = await runCron('/api/admin/points/weekly')
      setCronResult({ ok: r.ok, message: r.ok ? 'Weekly processing complete' : (r.data?.error || 'Weekly processing failed'), data: r.data })
    } finally {
      setCronRunning(false)
    }
  }, [runCron])

  const runRecalc = useCallback(async () => {
    setCronRunning(true)
    setCronResult(null)
    try {
      const r = await runCron('/api/admin/points/recalculate', { season: 1, with_decay: true })
      setCronResult({ ok: r.ok, message: r.ok ? 'Recalculation complete' : (r.data?.error || 'Recalculation failed'), data: r.data })
    } finally {
      setCronRunning(false)
    }
  }, [runCron])

  const runRetention = useCallback(async () => {
    setCronRunning(true)
    setCronResult(null)
    try {
      const r = await runCron('/api/admin/x/retention')
      setCronResult({ ok: r.ok, message: r.ok ? 'Retention check complete' : (r.data?.error || 'Retention check failed'), data: r.data })
    } finally {
      setCronRunning(false)
    }
  }, [runCron])

  const [snapshotSeason, setSnapshotSeason] = useState('1')
  const [snapshotPoolWei, setSnapshotPoolWei] = useState('')
  const [snapshotResult, setSnapshotResult] = useState<{ ok: boolean; message: string; data?: any } | null>(null)
  const [snapshotRunning, setSnapshotRunning] = useState(false)

  const runSnapshot = useCallback(async () => {
    if (!adminApiKey.trim() || snapshotRunning) return
    setSnapshotRunning(true)
    setSnapshotResult(null)
    try {
      const season = parseInt(snapshotSeason || '1')
      const pool = snapshotPoolWei.trim()
      const url = `/api/admin/season/snapshot?season=${encodeURIComponent(String(season))}&pool_size=${encodeURIComponent(pool)}`
      const res = await fetch(url, { headers: authHeaderApiKey })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSnapshotResult({ ok: false, message: data?.error || 'Snapshot failed', data })
        return
      }
      setSnapshotResult({ ok: true, message: `Snapshot generated (season ${season})`, data })
    } finally {
      setSnapshotRunning(false)
    }
  }, [adminApiKey, snapshotSeason, snapshotPoolWei, snapshotRunning, authHeaderApiKey])

  return (
    <AuthGuard requireAdmin>
    <div className="ap-content">
      <div className="ap-page-header">
        <h1 className="ap-page-title">Admin</h1>
        <p className="ap-page-desc">
          This page is a thin UI over existing `/api/admin/*` endpoints. Secrets are kept in-memory and not stored.
        </p>
      </div>

      <div className="ap-card">
        <h2 className="ap-card-title">Credentials</h2>
        <div className="ap-field">
          <label className="ap-field-label">Admin API Key (for sybil + snapshot)</label>
          <input
            type="password"
            className="ap-field-input"
            value={adminApiKey}
            onChange={(e) => setAdminApiKey(e.target.value)}
            placeholder="ADMIN_API_KEY"
          />
        </div>
        <div className="ap-field">
          <label className="ap-field-label">Admin Secret / Cron Secret (for points + retention)</label>
          <input
            type="password"
            className="ap-field-input"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            placeholder="ADMIN_SECRET or CRON_SECRET"
          />
        </div>
      </div>

      <div className="ap-card">
        <h2 className="ap-card-title">Sybil Review Queue</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={loadSybilFlags} className="ap-btn-primary" disabled={sybilLoading || !adminApiKey.trim()}>
            {sybilLoading ? 'Loading...' : 'Load Flags'}
          </button>
        </div>

        {sybilError && <p className="ap-card-text" style={{ color: '#ef4444' }}>{sybilError}</p>}

        {sybilFlags.length > 0 && (
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {sybilFlags.map((f) => (
              <div
                key={f.wallet_address}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(0,0,0,0.20)',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, opacity: 0.9 }}>{f.wallet_address}</div>
                  <div className="wc-field-helper" style={{ margin: 0 }}>risk_score: {f.risk_score}</div>
                </div>
                <button
                  onClick={() => setWallet(f.wallet_address)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="wc-field-helper" style={{ marginBottom: 8 }}>Submit Review</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', gap: 8 }}>
            <input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              className="ap-field-input"
            />
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value as any)}
              className="ap-field-input"
            >
              <option value="approve">approve</option>
              <option value="flag">flag</option>
              <option value="reject">reject</option>
            </select>
            <input
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              placeholder="reviewer"
              className="ap-field-input"
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={submitReview} className="ap-btn-primary" disabled={!adminApiKey.trim() || !wallet.trim() || reviewing}>
              {reviewing ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
          {reviewResult && (
            <p className="ap-card-text" style={{ color: reviewResult.ok ? '#22c55e' : '#ef4444' }}>
              {reviewResult.message}
            </p>
          )}
        </div>
      </div>

      <div className="ap-card">
        <h2 className="ap-card-title">Ops</h2>
        <p className="ap-card-text">
          These triggers require `ADMIN_SECRET` or `CRON_SECRET`. They are intended for cron, but can be run manually here.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={runWeekly} className="ap-btn-primary" disabled={cronRunning || !adminSecret.trim()}>
            Weekly Activity
          </button>
          <button onClick={runRecalc} className="ap-btn-primary" disabled={cronRunning || !adminSecret.trim()}>
            Recalculate Scores
          </button>
          <button onClick={runRetention} className="ap-btn-primary" disabled={cronRunning || !adminSecret.trim()}>
            X Retention Check
          </button>
        </div>
        {cronResult && (
          <div style={{ marginTop: 10 }}>
            <p className="ap-card-text" style={{ color: cronResult.ok ? '#22c55e' : '#ef4444' }}>
              {cronResult.message}
            </p>
            <pre style={{
              margin: 0,
              marginTop: 8,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 12,
              overflowX: 'auto',
            }}>
              {JSON.stringify(cronResult.data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="ap-card">
        <h2 className="ap-card-title">Season Snapshot (Merkle)</h2>
        <p className="ap-card-text">
          Generates a season allocation snapshot and returns the merkle root and top allocations.
          Requires `ADMIN_API_KEY`. `pool_size` must be in wei.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 160px', gap: 8 }}>
          <input
            value={snapshotSeason}
            onChange={(e) => setSnapshotSeason(e.target.value)}
            className="ap-field-input"
            placeholder="season"
          />
          <input
            value={snapshotPoolWei}
            onChange={(e) => setSnapshotPoolWei(e.target.value)}
            className="ap-field-input"
            placeholder="pool_size (wei)"
          />
          <button onClick={runSnapshot} className="ap-btn-primary" disabled={!adminApiKey.trim() || !snapshotPoolWei.trim() || snapshotRunning}>
            {snapshotRunning ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {snapshotResult && (
          <div style={{ marginTop: 10 }}>
            <p className="ap-card-text" style={{ color: snapshotResult.ok ? '#22c55e' : '#ef4444' }}>
              {snapshotResult.message}
            </p>
            <pre style={{
              margin: 0,
              marginTop: 8,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 12,
              overflowX: 'auto',
            }}>
              {JSON.stringify(snapshotResult.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  )
}
