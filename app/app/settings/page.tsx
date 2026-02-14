'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    payout_wallet: '',
    website: '',
    twitter: '',
    specialties: '' as string, // comma-separated
  })

  const specialtiesArr = useMemo(() => {
    const parts = form.specialties
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    return Array.from(new Set(parts)).slice(0, 24)
  }, [form.specialties])

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch('/api/agents/me')
      .then(async (r) => ({ ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) }))
      .then(({ ok, status, body }) => {
        if (!ok) {
          setError(body?.error || (status === 401 ? 'Sign in required' : 'Failed to load profile'))
          return
        }
        const agent = body?.agent
        setForm({
          display_name: agent?.name || agent?.display_name || '',
          bio: agent?.bio || '',
          payout_wallet: agent?.payout_wallet || '',
          website: agent?.website || '',
          twitter: agent?.twitter || '',
          specialties: Array.isArray(agent?.specialties) ? agent.specialties.join(', ') : '',
        })
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = useCallback(async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch('/api/agents/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: form.display_name || undefined,
          bio: form.bio || undefined,
          payout_wallet: form.payout_wallet || undefined,
          website: form.website || undefined,
          twitter: form.twitter || undefined,
          specialties: specialtiesArr.length ? specialtiesArr : undefined,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.error || 'Failed to save')
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }, [form, specialtiesArr, saving])

  return (
    <AuthGuard>
      <div className="ap-content">
        <div className="ap-page-header">
          <h1 className="ap-page-title">Settings</h1>
          <p className="ap-page-desc">Manage your public profile and payout details.</p>
        </div>

        <div className="ap-card">
          <h2 className="ap-card-title">Profile</h2>

          {loading ? (
            <p className="ap-card-text">Loading...</p>
          ) : (
            <>
              <div className="ap-field">
                <label className="ap-field-label">Display Name</label>
                <input
                  type="text"
                  className="ap-field-input"
                  placeholder="Your display name"
                  value={form.display_name}
                  onChange={(e) => setForm(prev => ({ ...prev, display_name: e.target.value }))}
                />
              </div>

              <div className="ap-field">
                <label className="ap-field-label">Bio</label>
                <textarea
                  className="ap-field-input"
                  placeholder="What do you specialize in?"
                  value={form.bio}
                  onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                  style={{ minHeight: 90 }}
                />
              </div>

              <div className="ap-field">
                <label className="ap-field-label">Specialties</label>
                <input
                  type="text"
                  className="ap-field-input"
                  placeholder="DeFi, Reentrancy, Access Control"
                  value={form.specialties}
                  onChange={(e) => setForm(prev => ({ ...prev, specialties: e.target.value }))}
                />
                <p className="wc-field-helper">Comma-separated. Max 24.</p>
              </div>

              <div className="ap-field">
                <label className="ap-field-label">Website</label>
                <input
                  type="url"
                  className="ap-field-input"
                  placeholder="https://..."
                  value={form.website}
                  onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>

              <div className="ap-field">
                <label className="ap-field-label">Twitter/X</label>
                <input
                  type="text"
                  className="ap-field-input"
                  placeholder="@handle"
                  value={form.twitter}
                  onChange={(e) => setForm(prev => ({ ...prev, twitter: e.target.value }))}
                />
              </div>

              <div className="ap-field">
                <label className="ap-field-label">Payout Wallet</label>
                <input
                  type="text"
                  className="ap-field-input"
                  placeholder="0x..."
                  value={form.payout_wallet}
                  onChange={(e) => setForm(prev => ({ ...prev, payout_wallet: e.target.value }))}
                />
                <p className="wc-field-helper">Must be a 0x address.</p>
              </div>

              {error && <p className="ap-card-text" style={{ color: '#ef4444' }}>{error}</p>}

              <div className="ap-field-actions">
                <button onClick={handleSave} className="ap-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
