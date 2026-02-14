'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import XShareButton from '@/components/dashboard/XShareButton'

type XStatus = {
  verified: boolean
  x_handle: string | null
  verified_at: string | null
  can_share: boolean
  tweet_template?: string | null
}

export default function XGrowthWidget(props: {
  referralCode?: string | null
  streakWeeks?: number
  submissions?: number
  accepted?: number
}) {
  const [status, setStatus] = useState<XStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tweetInput, setTweetInput] = useState('')
  const [verifying, setVerifying] = useState(false)

  const canRenderShare = useMemo(() => {
    return !!status?.verified && !!props.referralCode
  }, [status?.verified, props.referralCode])

  const loadStatus = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch('/api/x/status')
      .then(async (r) => ({ ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) }))
      .then(({ ok, status: httpStatus, body }) => {
        if (!ok) {
          // If the user isn't signed in, AuthGuard should prevent this page anyway.
          if (httpStatus === 401) {
            setStatus(null)
            return
          }
          setError(body?.error || 'Failed to load X status')
          setStatus(null)
          return
        }
        setStatus(body as XStatus)
      })
      .catch(() => {
        setError('Failed to load X status')
        setStatus(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const startOAuth = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/x/auth')
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data?.error || 'X OAuth is not available')
      return
    }
    if (data?.auth_url) {
      window.location.href = data.auth_url
    } else {
      setError('X auth URL missing')
    }
  }, [])

  const verifyTweet = useCallback(async () => {
    if (!tweetInput || verifying) return
    setVerifying(true)
    setError(null)
    try {
      const res = await fetch('/api/x/verify-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweet_url: tweetInput, tweet_id: tweetInput }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Verification failed')
        return
      }
      setTweetInput('')
      loadStatus()
    } finally {
      setVerifying(false)
    }
  }, [tweetInput, verifying, loadStatus])

  if (loading) {
    return (
      <div className="ap-stat-card" style={{ gridColumn: '1 / -1' }}>
        <p className="ap-stat-label">𝕏 Verification</p>
        <p className="wc-field-helper">Loading...</p>
      </div>
    )
  }

  return (
    <div className="ap-stat-card" style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <p className="ap-stat-label">𝕏 Verification</p>
          <p className="wc-field-helper" style={{ marginTop: 4 }}>
            {status?.verified
              ? `Verified${status.x_handle ? ` as @${status.x_handle}` : ''}`
              : status?.x_handle
                ? `Linked as @${status.x_handle} (verification pending)`
                : 'Link and verify your X to unlock share points'}
          </p>
        </div>

        {canRenderShare ? (
          <XShareButton
            variant="milestone"
            isVerified={true}
            data={{
              referralCode: props.referralCode || undefined,
              streakWeeks: props.streakWeeks || 0,
              submissions: props.submissions || 0,
              accepted: props.accepted || 0,
            }}
            compact
          />
        ) : (
          <button
            onClick={startOAuth}
            className="pr-cta-primary"
            style={{ padding: '8px 14px', fontSize: 13, whiteSpace: 'nowrap' }}
          >
            {status?.x_handle ? 'Re-link X' : 'Link X'}
          </button>
        )}
      </div>

      {!status?.verified && status?.tweet_template && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="wc-field-helper" style={{ marginBottom: 8 }}>
            Post this verification tweet, then paste the tweet URL or ID:
          </p>
          <pre style={{
            margin: 0,
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            fontSize: 12,
            whiteSpace: 'pre-wrap',
          }}>
            {status.tweet_template}
          </pre>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              value={tweetInput}
              onChange={(e) => setTweetInput(e.target.value)}
              placeholder="https://x.com/.../status/123 or 123"
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(0,0,0,0.25)',
                color: '#fff',
                fontSize: 13,
              }}
            />
            <button
              onClick={verifyTweet}
              disabled={!tweetInput || verifying}
              style={{
                padding: '10px 14px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.10)',
                background: verifying ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)',
                color: '#fff',
                cursor: verifying ? 'wait' : 'pointer',
                fontSize: 13,
                whiteSpace: 'nowrap',
              }}
            >
              {verifying ? 'Verifying...' : 'Verify Tweet'}
            </button>
          </div>

          {error && <p style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>{error}</p>}
        </div>
      )}

      {!status?.verified && !status?.tweet_template && error && (
        <p style={{ marginTop: 10, fontSize: 12, color: '#ef4444' }}>{error}</p>
      )}

      {status?.verified && !props.referralCode && (
        <p className="wc-field-helper" style={{ marginTop: 10 }}>
          Share points unlock when your referral code is available.
        </p>
      )}
    </div>
  )
}

