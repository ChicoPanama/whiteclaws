'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'

export default function ReferralApplyPage({ params }: { params: { code: string } }) {
  const code = params.code
  const [status, setStatus] = useState<'idle' | 'applying' | 'done'>('idle')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const apply = useCallback(async () => {
    if (!code || status === 'applying') return
    setStatus('applying')
    setResult(null)
    try {
      const res = await fetch('/api/referral/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referral_code: code }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setResult({ ok: false, message: body?.error || 'Failed to apply referral code' })
      } else {
        setResult({ ok: true, message: body?.message || 'Referral applied.' })
      }
    } finally {
      setStatus('done')
    }
  }, [code, status])

  useEffect(() => {
    // Auto-apply once the user is authenticated (AuthGuard ensures auth).
    apply()
  }, [apply])

  return (
    <AuthGuard>
      <div className="pr-page">
        <div className="pr-wrap">
          <div className="ap-page-header">
            <h1 className="ap-page-title">Referral</h1>
            <p className="ap-page-sub">Applying code: <code>{code}</code></p>
          </div>

          <div className="pr-card" style={{ padding: 24 }}>
            {status !== 'done' ? (
              <p className="wc-field-helper">Applying referral...</p>
            ) : result ? (
              <>
                <p style={{ color: result.ok ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                  {result.ok ? 'Success' : 'Failed'}
                </p>
                <p className="wc-field-helper" style={{ marginTop: 8 }}>
                  {result.message}
                </p>
              </>
            ) : (
              <p className="wc-field-helper">Done.</p>
            )}

            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/dashboard" className="pr-cta-primary" style={{ padding: '10px 14px', fontSize: 13 }}>
                Go to Dashboard
              </Link>
              <button
                onClick={() => apply()}
                className="pr-cta-primary"
                style={{ padding: '10px 14px', fontSize: 13, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                Retry Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

