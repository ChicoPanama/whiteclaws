'use client';

import { useEffect, useState, useCallback } from 'react';

interface ReferralData {
  code: string;
  total_referred: number;
  qualified_referred: number;
  bonus_earned: number;
}

export default function ReferralWidget({ apiKey }: { apiKey?: string }) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!apiKey) { setLoading(false); return; }
    fetch('/api/referral/code', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
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

  const referralLink = `whiteclaws.xyz/ref/${data.code}`;

  return (
    <div className="ap-stat-card" style={{ gridColumn: '1 / -1' }}>
      <p className="ap-stat-label" style={{ marginBottom: 12 }}>Referrals</p>

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
    </div>
  );
}
