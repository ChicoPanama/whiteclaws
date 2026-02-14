'use client';

import { useEffect, useState } from 'react';

interface PointsData {
  season: number;
  has_sbt: boolean;
  score: {
    security_points: number;
    growth_points: number;
    engagement_points: number;
    social_points: number;
    total_score: number;
    rank: number | null;
    streak_weeks: number;
    sybil_multiplier: number;
  };
  total_events: number;
}

export default function PointsBreakdown({ apiKey }: { apiKey?: string }) {
  const [data, setData] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/points/me', {
      headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : undefined,
    })
      .then(async (r) => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
      .then(({ ok, body }) => { setData(ok ? (body as PointsData) : null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiKey]);

  if (loading) {
    return (
      <div className="ap-stat-card" style={{ gridColumn: '1 / -1' }}>
        <p className="ap-stat-label">Points</p>
        <p className="wc-field-helper">Loading...</p>
      </div>
    );
  }

  if (!data || !data.has_sbt) {
    return (
      <div className="ap-stat-card" style={{ gridColumn: '1 / -1' }}>
        <p className="ap-stat-label">🦞 Points System</p>
        <p className="ap-stat-value">Mint SBT to Start</p>
        <p className="wc-field-helper">
          Mint your Access SBT ($20) to start earning points toward the $WC airdrop.
        </p>
      </div>
    );
  }

  const { score } = data;
  const maxTier = Math.max(score.security_points, score.growth_points, score.engagement_points, score.social_points, 1);

  const tiers = [
    { label: 'Security', points: score.security_points, color: '#ef4444' },
    { label: 'Growth', points: score.growth_points, color: '#3b82f6' },
    { label: 'Engagement', points: score.engagement_points, color: '#8b5cf6' },
    { label: 'Social', points: score.social_points, color: '#22c55e' },
  ];

  return (
    <>
      <div className="ap-stat-card">
        <p className="ap-stat-label">Total Score</p>
        <p className="ap-stat-value ap-stat-active">{Math.round(score.total_score).toLocaleString()}</p>
        <p className="wc-field-helper">Season {data.season}</p>
      </div>

      <div className="ap-stat-card">
        <p className="ap-stat-label">Rank</p>
        <p className="ap-stat-value">{score.rank ? `#${score.rank}` : '—'}</p>
        <p className="wc-field-helper">{data.total_events} events recorded</p>
      </div>

      <div className="ap-stat-card">
        <p className="ap-stat-label">Streak</p>
        <p className="ap-stat-value ap-stat-active">{score.streak_weeks}w</p>
        <p className="wc-field-helper">
          {score.streak_weeks >= 4 ? '🔥 On fire!' : 'Keep it going'}
        </p>
      </div>

      <div className="ap-stat-card" style={{ gridColumn: '1 / -1' }}>
        <p className="ap-stat-label" style={{ marginBottom: 12 }}>Points Breakdown</p>
        {tiers.map((tier) => (
          <div key={tier.label} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="wc-field-helper" style={{ margin: 0 }}>{tier.label}</span>
              <span className="wc-field-helper" style={{ margin: 0 }}>{tier.points.toLocaleString()}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(tier.points / maxTier) * 100}%`,
                  background: tier.color,
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
