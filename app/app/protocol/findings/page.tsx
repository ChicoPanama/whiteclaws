'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Finding {
  id: string
  title: string
  severity: string
  status: string
  created_at: string
  researcher?: { handle: string; display_name: string }
}

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#6b7280',
}

const statusColors: Record<string, string> = {
  submitted: '#8b5cf6',
  triaged: '#3b82f6',
  accepted: '#22c55e',
  rejected: '#ef4444',
  duplicate: '#6b7280',
  paid: '#10b981',
}

export default function ProtocolFindingsPage() {
  const [findings, setFindings] = useState<Finding[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')

  const slug = typeof window !== 'undefined' ? localStorage.getItem('wc_protocol_slug') || '' : ''
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem('wc_protocol_api_key') || '' : ''

  const loadFindings = async () => {
    if (!slug || !apiKey) return
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterSeverity) params.set('severity', filterSeverity)

    try {
      const res = await fetch(`/api/protocols/${slug}/findings?${params}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFindings(data.findings || [])
        setTotal(data.total || data.count || 0)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFindings() }, [slug, apiKey, filterStatus, filterSeverity])

  if (!slug) {
    return (
      <div className="ap-content">
        <div className="ap-page-header">
          <h1 className="ap-page-title">Findings</h1>
          <p className="ap-page-desc">Please set your protocol slug in the dashboard first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ap-content">
      <div className="ap-page-header">
        <h1 className="ap-page-title">Findings ({total})</h1>
        <p className="ap-page-desc">Review and triage vulnerability submissions.</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <select className="ap-field-input" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="triaged">Triaged</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
        </select>
        <select className="ap-field-input" style={{ width: 'auto' }} value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <div className="ap-card"><p className="ap-card-text">Loading findings...</p></div>
      ) : findings.length === 0 ? (
        <div className="ap-card"><p className="ap-card-text">No findings yet.</p></div>
      ) : (
        findings.map(f => (
          <Link key={f.id} href={`/app/protocol/findings/${f.id}`} style={{ textDecoration: 'none' }}>
            <div className="ap-card" style={{ marginBottom: '8px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{f.title}</strong>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ color: severityColors[f.severity] || '#888', fontSize: '13px', textTransform: 'uppercase', fontWeight: 600 }}>{f.severity}</span>
                    <span style={{ color: statusColors[f.status] || '#888', fontSize: '13px', textTransform: 'uppercase' }}>{f.status}</span>
                  </div>
                  {f.researcher && (
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>by {f.researcher.display_name || f.researcher.handle}</span>
                  )}
                </div>
                <span style={{ fontSize: '12px', opacity: 0.5 }}>{new Date(f.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  )
}
