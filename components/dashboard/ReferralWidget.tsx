'use client';

import { useEffect, useState, useCallback } from 'react';

interface ReferralStatsResponse {
  referral: {
    code: string | null;
    link: string | null;
    total_referred: number;
    qualified_referred: number;
    bonus_earned: number;
    recent_rewards: Array<{ id?: string; created_at?: string; points?: number; status?: string }>;
  };
}

export default function ReferralWidget({ apiKey }: { apiKey?: string }) {
  const [data, setData] = useState<ReferralStatsResponse['referral'] | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applyCode, setApplyCode] = useState('');
  const [applyResult, setApplyResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/referral/stats', {
      headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : undefined,
    })
      .then(async (r) => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
      .then(({ ok, body }) => {
        setData(ok ? ((body as ReferralStatsResponse).referral || null) : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiKey]);

  const copyLink = useCallback(() => {
    if (!data?.code) return;
    const link = `https://whiteclaws.xyz/ref/${data.code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data?.code]);

  if (loading || !data) {
    return null; // Don't render until loaded
  }

  const referralLink = data.code ? `whiteclaws.xyz/ref/${data.code}` : null;

  const apply = useCallback(async () => {
    if (!applyCode || applying) return;
    setApplying(true);
    setApplyResult(null);
    try {
      const res = await fetch('/api/referral/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ referral_code: applyCode.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApplyResult({ ok: false, message: body?.error || 'Failed to apply referral code' });
        return;
      }
      setApplyResult({ ok: true, message: body?.message || 'Referral applied.' });
      setApplyCode('');
    } finally {
      setApplying(false);
    }
  }, [applyCode, applying, apiKey]);

  return (
    <div className="ap-stat-card" style={{ gridColumn: '1 / -1' }}>
      <p className="ap-stat-label" style={{ marginBottom: 12 }}>Referrals</p>

      {referralLink && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <code style={{
            flex: 1,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            fontSize: 13,
            color: 'rgba(255,255,255,0.7)',
          }}>
            {referralLink}
          </code>
          <button
            onClick={copyLink}
            style={{
              padding: '8px 16px',
              background: copied ? '#22c55e' : 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: copied ? '#000' : '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{data.total_referred}</span>
          <span className="wc-field-helper" style={{ marginLeft: 4 }}>referred</span>
        </div>
        <div>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#22c55e' }}>{data.qualified_referred}</span>
          <span className="wc-field-helper" style={{ marginLeft: 4 }}>qualified</span>
        </div>
        <div>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#8b5cf6' }}>+{data.bonus_earned}</span>
          <span className="wc-field-helper" style={{ marginLeft: 4 }}>bonus pts</span>
        </div>
      </div>

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="wc-field-helper" style={{ marginBottom: 8 }}>
          Have a referral code?
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={applyCode}
            onChange={(e) => setApplyCode(e.target.value)}
            placeholder="Enter code"
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
            onClick={apply}
            disabled={!applyCode.trim() || applying}
            style={{
              padding: '10px 14px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.10)',
              background: applying ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              cursor: applying ? 'wait' : 'pointer',
              fontSize: 13,
              whiteSpace: 'nowrap',
            }}
          >
            {applying ? 'Applying...' : 'Apply'}
          </button>
        </div>
        {applyResult && (
          <p style={{ marginTop: 8, fontSize: 12, color: applyResult.ok ? '#22c55e' : '#ef4444' }}>
            {applyResult.message}
          </p>
        )}
      </div>
    </div>
  );
}
