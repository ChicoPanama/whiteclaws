'use client'

import { useEffect, useState } from 'react'

interface PaidFinding {
  id: string
  title: string
  severity: string
  payout_amount: number
  payout_currency: string
  payout_tx_hash: string | null
  paid_at: string
  researcher?: { handle: string; display_name: string }
}

export default function ProtocolPayoutsPage() {
  const [findings, setFindings] = useState<PaidFinding[]>([])
  const [pendingFindings, setPendingFindings] = useState<PaidFinding[]>([])
  const [loading, setLoading] = useState(true)

  const slug = typeof window !== 'undefined' ? localStorage.getItem('wc_protocol_slug') || '' : ''
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem('wc_protocol_api_key') || '' : ''

  useEffect(() => {
    if (!slug || !apiKey) return
    setLoading(true)

    Promise.all([
      fetch(`/api/protocols/${slug}/findings?status=paid`, { headers: { 'Authorization': `Bearer ${apiKey}` } }).then(r => r.json()),
      fetch(`/api/protocols/${slug}/findings?status=accepted`, { headers: { 'Authorization': `Bearer ${apiKey}` } }).then(r => r.json()),
    ]).then(([paidData, pendingData]) => {
      setFindings(paidData.findings || [])
      setPendingFindings(pendingData.findings || [])
    }).finally(() => setLoading(false))
  }, [slug, apiKey])

  const totalPaid = findings.reduce((sum, f) => sum + (Number(f.payout_amount) || 0), 0)
  const totalPending = pendingFindings.reduce((sum, f) => sum + (Number(f.payout_amount) || 0), 0)

  const exportCSV = () => {
    const rows = [['ID', 'Title', 'Severity', 'Amount', 'Currency', 'TX Hash', 'Paid At', 'Researcher']]
    for (const f of findings) {
      rows.push([f.id, f.title, f.severity, String(f.payout_amount), f.payout_currency, f.payout_tx_hash || '', f.paid_at, f.researcher?.handle || ''])
    }
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}-payouts.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!slug) {
    return (
      <div className="ap-content">
        <div className="ap-page-header">
          <h1 className="ap-page-title">Payouts</h1>
          <p className="ap-page-desc">Please set your protocol slug in the dashboard first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ap-content">
      <div className="ap-page-header">
        <h1 className="ap-page-title">Payouts</h1>
        <p className="ap-page-desc">Payment history and pending payouts.</p>
      </div>

      <div className="ap-stat-grid">
        <div className="ap-stat-card">
          <p className="ap-stat-label">Total Paid</p>
          <p className="ap-stat-value">{loading ? '...' : `$${totalPaid.toLocaleString()}`}</p>
        </div>
        <div className="ap-stat-card">
          <p className="ap-stat-label">Pending</p>
          <p className="ap-stat-value">{loading ? '...' : `$${totalPending.toLocaleString()}`}</p>
        </div>
        <div className="ap-stat-card">
          <p className="ap-stat-label">Findings Paid</p>
          <p className="ap-stat-value">{loading ? '...' : findings.length}</p>
        </div>
      </div>

      {pendingFindings.length > 0 && (
        <div className="ap-card">
          <h2 className="ap-card-title">Pending Payouts ({pendingFindings.length})</h2>
          {pendingFindings.map(f => (
            <div key={f.id} style={{ padding: '8px', marginBottom: '8px', background: 'var(--bg-secondary, #111)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{f.title}</strong>
                <span style={{ marginLeft: '8px', fontSize: '12px', textTransform: 'uppercase', color: '#f59e0b' }}>{f.severity}</span>
              </div>
              <span>${Number(f.payout_amount || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      <div className="ap-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 className="ap-card-title" style={{ margin: 0 }}>Payment History ({findings.length})</h2>
          {findings.length > 0 && (
            <button onClick={exportCSV} className="ap-btn-primary" style={{ fontSize: '13px' }}>Export CSV</button>
          )}
        </div>
        {loading ? (
          <p className="ap-card-text">Loading...</p>
        ) : findings.length === 0 ? (
          <p className="ap-card-text">No payments recorded yet.</p>
        ) : (
          findings.map(f => (
            <div key={f.id} style={{ padding: '8px', marginBottom: '8px', background: 'var(--bg-secondary, #111)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{f.title}</strong>
                  <span style={{ marginLeft: '8px', fontSize: '12px', textTransform: 'uppercase', color: '#22c55e' }}>{f.severity}</span>
                  {f.researcher && <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.6 }}>to {f.researcher.display_name || f.researcher.handle}</span>}
                </div>
                <span style={{ fontWeight: 600 }}>${Number(f.payout_amount).toLocaleString()} {f.payout_currency}</span>
              </div>
              {f.payout_tx_hash && <p style={{ fontSize: '12px', opacity: 0.5, margin: '4px 0 0' }}>TX: {f.payout_tx_hash}</p>}
              <p style={{ fontSize: '12px', opacity: 0.4, margin: '2px 0 0' }}>{new Date(f.paid_at).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
