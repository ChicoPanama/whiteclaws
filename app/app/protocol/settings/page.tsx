'use client'

import { useEffect, useState } from 'react'

export default function ProtocolSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    status: 'active',
    min_payout: '500',
    max_payout: '100000',
    payout_currency: 'USDC',
    payout_wallet: '',
    poc_required: true,
    kyc_required: false,
    duplicate_policy: 'first',
    response_sla_hours: '72',
    cooldown_hours: '24',
    encryption_public_key: '',
  })

  const slug = typeof window !== 'undefined' ? localStorage.getItem('wc_protocol_slug') || '' : ''
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem('wc_protocol_api_key') || '' : ''

  useEffect(() => {
    if (!slug) return
    fetch(`/api/protocols/${slug}/program`)
      .then(r => r.json())
      .then(data => {
        if (data.program) {
          const p = data.program
          setForm({
            status: p.status || 'active',
            min_payout: String(p.min_payout || 500),
            max_payout: String(p.max_payout || 100000),
            payout_currency: p.payout_currency || 'USDC',
            payout_wallet: p.payout_wallet || '',
            poc_required: p.poc_required ?? true,
            kyc_required: p.kyc_required ?? false,
            duplicate_policy: p.duplicate_policy || 'first',
            response_sla_hours: String(p.response_sla_hours || 72),
            cooldown_hours: String(p.cooldown_hours || 24),
            encryption_public_key: p.encryption_public_key || '',
          })
        }
      })
  }, [slug])

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`/api/protocols/${slug}/program`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          status: form.status,
          min_payout: Number(form.min_payout),
          max_payout: Number(form.max_payout),
          payout_currency: form.payout_currency,
          payout_wallet: form.payout_wallet || null,
          poc_required: form.poc_required,
          kyc_required: form.kyc_required,
          duplicate_policy: form.duplicate_policy,
          response_sla_hours: Number(form.response_sla_hours),
          cooldown_hours: Number(form.cooldown_hours),
          encryption_public_key: form.encryption_public_key || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('Settings saved')
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateKey = async () => {
    try {
      const nacl = await import('tweetnacl')
      const naclUtil = await import('tweetnacl-util')
      const keypair = nacl.box.keyPair()
      const pubKey = naclUtil.encodeBase64(keypair.publicKey)
      const privKey = naclUtil.encodeBase64(keypair.secretKey)
      setForm(prev => ({ ...prev, encryption_public_key: pubKey }))
      alert(`SAVE THIS PRIVATE KEY — it will not be shown again:\n\n${privKey}\n\nPublic key has been set in the form. Click "Save" to update.`)
    } catch {
      alert('Failed to generate keypair')
    }
  }

  if (!slug) {
    return (
      <div className="ap-content">
        <div className="ap-page-header">
          <h1 className="ap-page-title">Settings</h1>
          <p className="ap-page-desc">Please set your protocol slug in the dashboard first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ap-content">
      <div className="ap-page-header">
        <h1 className="ap-page-title">Program Settings</h1>
        <p className="ap-page-desc">Update your bounty program configuration.</p>
      </div>

      {message && <p style={{ color: message === 'Settings saved' ? '#22c55e' : '#ef4444', marginBottom: '16px' }}>{message}</p>}

      <div className="ap-card">
        <h2 className="ap-card-title">Program Status</h2>
        <div className="ap-field">
          <select className="ap-field-input" value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="ended">Ended</option>
          </select>
        </div>
      </div>

      <div className="ap-card">
        <h2 className="ap-card-title">Payout Configuration</h2>
        <div className="ap-field">
          <label className="ap-field-label">Min Payout (USD)</label>
          <input type="number" className="ap-field-input" value={form.min_payout} onChange={e => setForm(prev => ({ ...prev, min_payout: e.target.value }))} />
        </div>
        <div className="ap-field">
          <label className="ap-field-label">Max Payout (USD)</label>
          <input type="number" className="ap-field-input" value={form.max_payout} onChange={e => setForm(prev => ({ ...prev, max_payout: e.target.value }))} />
        </div>
        <div className="ap-field">
          <label className="ap-field-label">Currency</label>
          <select className="ap-field-input" value={form.payout_currency} onChange={e => setForm(prev => ({ ...prev, payout_currency: e.target.value }))}>
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
            <option value="ETH">ETH</option>
            <option value="DAI">DAI</option>
          </select>
        </div>
        <div className="ap-field">
          <label className="ap-field-label">Payout Wallet</label>
          <input type="text" className="ap-field-input" value={form.payout_wallet} onChange={e => setForm(prev => ({ ...prev, payout_wallet: e.target.value }))} placeholder="0x..." />
        </div>
      </div>

      <div className="ap-card">
        <h2 className="ap-card-title">Rules</h2>
        <div className="ap-toggle-row">
          <span className="ap-toggle-label">Require Proof of Concept</span>
          <input type="checkbox" className="ap-toggle" checked={form.poc_required} onChange={e => setForm(prev => ({ ...prev, poc_required: e.target.checked }))} />
        </div>
        <div className="ap-toggle-row">
          <span className="ap-toggle-label">Require KYC</span>
          <input type="checkbox" className="ap-toggle" checked={form.kyc_required} onChange={e => setForm(prev => ({ ...prev, kyc_required: e.target.checked }))} />
        </div>
        <div className="ap-field">
          <label className="ap-field-label">Duplicate Policy</label>
          <select className="ap-field-input" value={form.duplicate_policy} onChange={e => setForm(prev => ({ ...prev, duplicate_policy: e.target.value }))}>
            <option value="first">First (first valid submission wins)</option>
            <option value="best">Best (best report wins)</option>
          </select>
        </div>
        <div className="ap-field">
          <label className="ap-field-label">Response SLA (hours)</label>
          <input type="number" className="ap-field-input" value={form.response_sla_hours} onChange={e => setForm(prev => ({ ...prev, response_sla_hours: e.target.value }))} />
        </div>
        <div className="ap-field">
          <label className="ap-field-label">Submission Cooldown (hours)</label>
          <input type="number" className="ap-field-input" value={form.cooldown_hours} onChange={e => setForm(prev => ({ ...prev, cooldown_hours: e.target.value }))} />
        </div>
      </div>

      <div className="ap-card">
        <h2 className="ap-card-title">Encryption</h2>
        <div className="ap-field">
          <label className="ap-field-label">Public Key (Base64)</label>
          <input type="text" className="ap-field-input" value={form.encryption_public_key} onChange={e => setForm(prev => ({ ...prev, encryption_public_key: e.target.value }))} placeholder="NaCl public key..." />
        </div>
        <div className="ap-field-actions">
          <button onClick={handleGenerateKey} className="ap-btn-primary" style={{ background: '#6b7280' }}>Generate New Keypair</button>
        </div>
        <p className="ap-card-text" style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>Generating a new keypair will show the private key once. Old findings remain readable with the old key.</p>
      </div>

      <div className="ap-field-actions" style={{ marginTop: '16px' }}>
        <button onClick={handleSave} className="ap-btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
