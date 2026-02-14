'use client'

import { useEffect, useState } from 'react'

interface ScopeData {
  version: number
  contracts: Array<{ address: string; chain: string; name: string; compiler?: string }>
  in_scope: string[]
  out_of_scope: string[]
  severity_definitions: Record<string, { min: number; max: number; description: string }>
}

export default function ProtocolScopePage() {
  const [scope, setScope] = useState<ScopeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    contracts: '[]',
    in_scope: '',
    out_of_scope: '',
  })

  const slug = typeof window !== 'undefined' ? localStorage.getItem('wc_protocol_slug') || '' : ''

  useEffect(() => {
    if (!slug) return
    fetch(`/api/protocols/${slug}/scope`)
      .then(r => r.json())
      .then(data => {
        if (data.scope) {
          setScope(data.scope)
          setForm({
            contracts: JSON.stringify(data.scope.contracts || [], null, 2),
            in_scope: (data.scope.in_scope || []).join('\n'),
            out_of_scope: (data.scope.out_of_scope || []).join('\n'),
          })
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  const publishScope = async () => {
    setPublishing(true)
    setMessage('')
    try {
      let contracts
      try { contracts = JSON.parse(form.contracts) } catch { contracts = [] }

      const res = await fetch(`/api/protocols/${slug}/scope`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contracts,
          in_scope: form.in_scope.split('\n').filter(Boolean),
          out_of_scope: form.out_of_scope.split('\n').filter(Boolean),
          severity_definitions: scope?.severity_definitions || {},
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(`Scope updated to version ${data.scope.version}`)
      setScope(prev => prev ? { ...prev, version: data.scope.version } : prev)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to publish scope')
    } finally {
      setPublishing(false)
    }
  }

  if (!slug) {
    return (
      <div className="ap-content">
        <div className="ap-page-header">
          <h1 className="ap-page-title">Manage Scope</h1>
          <p className="ap-page-desc">Please set your protocol slug in the dashboard first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ap-content">
      <div className="ap-page-header">
        <h1 className="ap-page-title">Manage Scope</h1>
        <p className="ap-page-desc">
          Current version: <strong>{loading ? '...' : scope?.version || 0}</strong>
        </p>
      </div>

      {message && <p style={{ color: message.includes('updated') ? 'var(--text-success, #22c55e)' : 'var(--text-error, #ef4444)', marginBottom: '16px' }}>{message}</p>}

      <div className="ap-card">
        <h2 className="ap-card-title">Contracts (JSON)</h2>
        <div className="ap-field">
          <textarea
            className="ap-field-input"
            rows={8}
            value={form.contracts}
            onChange={(e) => setForm(prev => ({ ...prev, contracts: e.target.value }))}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}
            placeholder='[{"address": "0x...", "chain": "ethereum", "name": "Pool.sol"}]'
          />
        </div>
      </div>

      <div className="ap-card">
        <h2 className="ap-card-title">In Scope (one per line)</h2>
        <div className="ap-field">
          <textarea
            className="ap-field-input"
            rows={4}
            value={form.in_scope}
            onChange={(e) => setForm(prev => ({ ...prev, in_scope: e.target.value }))}
            placeholder="Smart contracts on Ethereum mainnet&#10;Governance contracts"
          />
        </div>
      </div>

      <div className="ap-card">
        <h2 className="ap-card-title">Out of Scope (one per line)</h2>
        <div className="ap-field">
          <textarea
            className="ap-field-input"
            rows={4}
            value={form.out_of_scope}
            onChange={(e) => setForm(prev => ({ ...prev, out_of_scope: e.target.value }))}
            placeholder="Frontend applications&#10;Off-chain infrastructure"
          />
        </div>
      </div>

      {scope?.severity_definitions && (
        <div className="ap-card">
          <h2 className="ap-card-title">Severity Tiers</h2>
          {Object.entries(scope.severity_definitions).map(([level, def]) => (
            <div key={level} style={{ marginBottom: '8px', padding: '8px', background: 'var(--bg-secondary, #111)', borderRadius: '6px' }}>
              <strong style={{ textTransform: 'capitalize' }}>{level}</strong>: ${def.min.toLocaleString()} – ${def.max.toLocaleString()}
              <br /><span style={{ opacity: 0.7, fontSize: '13px' }}>{def.description}</span>
            </div>
          ))}
        </div>
      )}

      <div className="ap-field-actions" style={{ marginTop: '16px' }}>
        <button onClick={publishScope} className="ap-btn-primary" disabled={publishing}>
          {publishing ? 'Publishing...' : 'Publish New Scope Version'}
        </button>
      </div>
    </div>
  )
}
