'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProtocolRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [form, setForm] = useState({
    name: '',
    slug: '',
    website_url: '',
    github_url: '',
    docs_url: '',
    contact_email: '',
    chains: 'ethereum',
    category: 'DeFi',
    max_bounty: '100000',
    description: '',
    logo_url: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/protocols/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          chains: form.chains.split(',').map(c => c.trim().toLowerCase()),
          max_bounty: Number(form.max_bounty),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')

      // Persist slug so dashboard auto-loads without manual entry (W3 wiring fix)
      if (data.protocol?.slug) {
        localStorage.setItem('wc_protocol_slug', data.protocol.slug)
      }

      setApiKey(data.api_key)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (apiKey) {
    return (
      <div className="ap-content">
        <div className="ap-page-header">
          <h1 className="ap-page-title">Protocol Registered</h1>
          <p className="ap-page-desc">Save your API key below. It will not be shown again.</p>
        </div>
        <div className="ap-card">
          <h2 className="ap-card-title">Your API Key</h2>
          <div className="ap-field">
            <code style={{ padding: '12px', background: 'var(--bg-secondary, #111)', display: 'block', borderRadius: '6px', wordBreak: 'break-all', fontSize: '14px' }}>
              {apiKey}
            </code>
          </div>
          <p className="ap-card-text" style={{ color: 'var(--text-warning, #f59e0b)' }}>
            Store this key securely. You will need it to manage your program and triage findings.
          </p>
          <div className="ap-field-actions">
            <button onClick={() => navigator.clipboard.writeText(apiKey)} className="ap-btn-primary">
              Copy to Clipboard
            </button>
            <button onClick={() => router.push('/app/protocol/dashboard')} className="ap-btn-primary" style={{ marginLeft: '8px' }}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ap-content">
      <div className="ap-page-header">
        <h1 className="ap-page-title">Register Protocol</h1>
        <p className="ap-page-desc">Register your project to create a bug bounty program on WhiteClaws.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="ap-card">
          <h2 className="ap-card-title">Protocol Details</h2>

          {error && <p style={{ color: 'var(--text-error, #ef4444)', marginBottom: '16px' }}>{error}</p>}

          <div className="ap-field">
            <label className="ap-field-label">Protocol Name *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} className="ap-field-input" placeholder="My Protocol" required minLength={2} />
          </div>

          <div className="ap-field">
            <label className="ap-field-label">Slug (URL-friendly name)</label>
            <input type="text" name="slug" value={form.slug} onChange={handleChange} className="ap-field-input" placeholder="my-protocol" />
          </div>

          <div className="ap-field">
            <label className="ap-field-label">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="ap-field-input" placeholder="Brief description of your protocol" rows={3} />
          </div>

          <div className="ap-field">
            <label className="ap-field-label">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className="ap-field-input">
              <option value="DeFi">DeFi</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="NFT">NFT</option>
              <option value="Gaming">Gaming</option>
              <option value="Bridge">Bridge</option>
              <option value="DAO">DAO</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="ap-field">
            <label className="ap-field-label">Chains (comma-separated)</label>
            <input type="text" name="chains" value={form.chains} onChange={handleChange} className="ap-field-input" placeholder="ethereum, polygon, arbitrum" />
          </div>

          <div className="ap-field">
            <label className="ap-field-label">Max Bounty (USD)</label>
            <input type="number" name="max_bounty" value={form.max_bounty} onChange={handleChange} className="ap-field-input" min="100" />
          </div>
        </div>

        <div className="ap-card">
          <h2 className="ap-card-title">Links</h2>

          <div className="ap-field">
            <label className="ap-field-label">Website</label>
            <input type="url" name="website_url" value={form.website_url} onChange={handleChange} className="ap-field-input" placeholder="https://myprotocol.xyz" />
          </div>

          <div className="ap-field">
            <label className="ap-field-label">GitHub</label>
            <input type="url" name="github_url" value={form.github_url} onChange={handleChange} className="ap-field-input" placeholder="https://github.com/myprotocol" />
          </div>

          <div className="ap-field">
            <label className="ap-field-label">Documentation</label>
            <input type="url" name="docs_url" value={form.docs_url} onChange={handleChange} className="ap-field-input" placeholder="https://docs.myprotocol.xyz" />
          </div>

          <div className="ap-field">
            <label className="ap-field-label">Contact Email</label>
            <input type="email" name="contact_email" value={form.contact_email} onChange={handleChange} className="ap-field-input" placeholder="security@myprotocol.xyz" />
          </div>

          <div className="ap-field">
            <label className="ap-field-label">Logo URL</label>
            <input type="url" name="logo_url" value={form.logo_url} onChange={handleChange} className="ap-field-input" placeholder="https://myprotocol.xyz/logo.png" />
          </div>
        </div>

        <div className="ap-field-actions" style={{ marginTop: '16px' }}>
          <button type="submit" className="ap-btn-primary" disabled={loading || !form.name}>
            {loading ? 'Registering...' : 'Register Protocol'}
          </button>
        </div>
      </form>
    </div>
  )
}
