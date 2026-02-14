'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';
import PointsBreakdown from '@/components/dashboard/PointsBreakdown';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import ReferralWidget from '@/components/dashboard/ReferralWidget';
import SBTMintWidget from '@/components/dashboard/SBTMintWidget';
import XGrowthWidget from '@/components/dashboard/XGrowthWidget';

interface Finding {
  id: string;
  title: string;
  severity: string;
  status: string;
  created_at: string;
  protocol?: { slug: string; name: string };
}

interface BountyProgram {
  slug: string;
  name: string;
  max_bounty: number;
  description?: string;
}

interface PointsData {
  season: number;
  week: number;
  score: {
    total: number;
    security_points: number;
    growth_points: number;
    engagement_points: number;
    penalty_points: number;
  };
  rank: number;
  streak_weeks: number;
  weekly: { points_earned: number; cap: number; remaining: number };
  warnings: { spam_flags: number; status: string };
  recent_events: Array<{ event: string; points: number; at: string; finding_id: string | null }>;
}

interface ReferralCodeResponse {
  code: string;
}

const statusColors: Record<string, string> = {
  submitted: '#8b5cf6',
  triaged: '#3b82f6',
  accepted: '#22c55e',
  rejected: '#ef4444',
  paid: '#10b981',
};

export default function DashboardContent() {
  const { user } = useAuth();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [bounties, setBounties] = useState<BountyProgram[]>([]);
  const [stats, setStats] = useState({ submissions: 0, accepted: 0, earned: 0 });
  const [points, setPoints] = useState<PointsData | null>(null);
  const [sbtStatus, setSbtStatus] = useState<{ hasSBT: boolean; isEarly: boolean; mintedAt: string | null }>({
    hasSBT: false, isEarly: false, mintedAt: null,
  });
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Load recent bounties
    fetch('/api/bounties?limit=4')
      .then(r => r.json())
      .then(data => setBounties(data.bounties || []))
      .catch(() => {});

    // Load points data (session cookie compatible; API key optional for back-compat).
    fetch('/api/points/me')
      .then(async (r) => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
      .then(({ ok, body }) => { if (ok && body?.season) setPoints(body as PointsData); })
      .catch(() => {});

    // Load referral code (session cookie compatible).
    fetch('/api/referral/code')
      .then(async (r) => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
      .then(({ ok, body }) => setReferralCode(ok ? ((body as ReferralCodeResponse).code || null) : null))
      .catch(() => setReferralCode(null));

    // Check SBT status
    const walletAddr = ((user?.user_metadata?.wallet_address as string) || null);
    if (walletAddr) {
      fetch(`/api/sbt/status?address=${walletAddr}`)
        .then(r => r.json())
        .then(data => setSbtStatus({
          hasSBT: data.has_sbt || false,
          isEarly: data.is_early || false,
          mintedAt: data.minted_at || null,
        }))
        .catch(() => {});
    }

    // If user has an API key stored, load their findings
    const storedKey = typeof window !== 'undefined' ? localStorage.getItem('wc_agent_api_key') : null;
    setApiKey(storedKey);

    if (storedKey) {
      fetch('/api/agents/findings?limit=5', {
        headers: { 'Authorization': `Bearer ${storedKey}` },
      })
        .then(r => r.json())
        .then(data => {
          const f = data.findings || [];
          setFindings(f);
          setStats(prev => ({
            ...prev,
            submissions: f.length,
            accepted: f.filter((x: Finding) => x.status === 'accepted' || x.status === 'paid').length,
          }));
        })
        .catch(() => {});

      fetch('/api/agents/earnings', {
        headers: { 'Authorization': `Bearer ${storedKey}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.earnings) {
            setStats(prev => ({ ...prev, earned: data.earnings.total_paid || 0 }));
          }
        })
        .catch(() => {});

      // Load points data
      fetch('/api/points/me', {
        headers: { 'Authorization': `Bearer ${storedKey}` },
      })
        .then(r => r.json())
        .then(data => { if (data.season) setPoints(data); })
        .catch(() => {});
    }
  }, [user]);

  return (
    <AuthGuard>
      <div className="pr-page">
        <div className="pr-wrap">
          <div className="ap-page-header">
            <h1 className="ap-page-title">Dashboard</h1>
          </div>

          {/* SBT Mint Widget — above the fold */}
          <div className="ap-stat-grid">
            <SBTMintWidget
              walletAddress={((user?.user_metadata?.wallet_address as string) || null)}
              hasSBT={sbtStatus.hasSBT}
              isEarly={sbtStatus.isEarly}
              mintedAt={sbtStatus.mintedAt}
            />
          </div>

          {/* Points Breakdown */}
          <div className="ap-stat-grid" style={{ marginTop: 16 }}>
            <PointsBreakdown apiKey={apiKey || undefined} />
          </div>

          {/* X Verification + Share */}
          <div className="ap-stat-grid" style={{ marginTop: 16 }}>
            <XGrowthWidget
              referralCode={referralCode}
              streakWeeks={points?.streak_weeks || 0}
              submissions={stats.submissions}
              accepted={stats.accepted}
            />
          </div>

          {/* Original Stats */}
          <div className="ap-stat-grid" style={{ marginTop: 16 }}>
            <div className="ap-stat-card">
              <p className="ap-stat-label">Total Submissions</p>
              <p className="ap-stat-value">{stats.submissions}</p>
              <p className="wc-field-helper">Across all programs</p>
            </div>
            <div className="ap-stat-card">
              <p className="ap-stat-label">Accepted</p>
              <p className="ap-stat-value ap-stat-active">{stats.accepted}</p>
              <p className="wc-field-helper">Successful findings</p>
            </div>
            <div className="ap-stat-card">
              <p className="ap-stat-label">Total Earned</p>
              <p className="ap-stat-value ap-stat-active">${stats.earned.toLocaleString()}</p>
              <p className="wc-field-helper">Bounty payouts</p>
            </div>
            <div className="ap-stat-card">
              <p className="ap-stat-label">$WC Score</p>
              <p className="ap-stat-value" style={{ color: '#f59e0b' }}>{points ? Math.floor(points.score.total).toLocaleString() : '—'}</p>
              <p className="wc-field-helper">{points ? `Rank #${points.rank} · Season ${points.season}` : 'Loading...'}</p>
            </div>
          </div>

          {/* Points Breakdown */}
          {points && (
            <div className="pr-card" style={{ marginBottom: '16px' }}>
              <h2 className="pr-card-title">$WC Points — Season {points.season}, Week {points.week}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                <div style={{ padding: '10px', background: 'var(--bg-secondary, #111)', borderRadius: '6px' }}>
                  <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>Security</p>
                  <p style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0', color: '#22c55e' }}>{points.score.security_points}</p>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-secondary, #111)', borderRadius: '6px' }}>
                  <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>Growth</p>
                  <p style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0', color: '#3b82f6' }}>{points.score.growth_points}</p>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-secondary, #111)', borderRadius: '6px' }}>
                  <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>Engagement</p>
                  <p style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0', color: '#8b5cf6' }}>{points.score.engagement_points}</p>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-secondary, #111)', borderRadius: '6px' }}>
                  <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>Penalties</p>
                  <p style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0', color: points.score.penalty_points > 0 ? '#ef4444' : '#525252' }}>-{points.score.penalty_points}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', opacity: 0.7, flexWrap: 'wrap' }}>
                <span>🔥 Streak: {points.streak_weeks}w</span>
                <span>📊 Weekly: {points.weekly.points_earned}/{points.weekly.cap}</span>
                {points.warnings.status !== 'clean' && (
                  <span style={{ color: '#ef4444' }}>⚠️ {points.warnings.spam_flags} flag{points.warnings.spam_flags !== 1 ? 's' : ''}</span>
                )}
              </div>

              {points.recent_events.length > 0 && (
                <div style={{ marginTop: '12px', borderTop: '1px solid #222', paddingTop: '8px' }}>
                  <p style={{ fontSize: '11px', opacity: 0.5, margin: '0 0 6px' }}>Recent Points</p>
                  {points.recent_events.slice(0, 5).map((e, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
                      <span style={{ opacity: 0.7 }}>{e.event.replace(/_/g, ' ')}</span>
                      <span style={{ fontWeight: 600, color: e.points >= 0 ? '#22c55e' : '#ef4444' }}>
                        {e.points >= 0 ? '+' : ''}{e.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity Feed + Referral Widget */}
          <div className="ap-stat-grid" style={{ marginTop: 16 }}>
            <ActivityFeed apiKey={apiKey || undefined} limit={8} />
            <ReferralWidget apiKey={apiKey || undefined} />
          </div>

          {/* Recent Findings with status notifications */}
          <div className="pr-card">
            <h2 className="pr-card-title">Recent Activity</h2>
            {findings.length === 0 ? (
              <p className="pr-empty">No recent activity. Submit your first finding!</p>
            ) : (
              findings.map(f => (
                <div key={f.id} style={{ padding: '8px', marginBottom: '6px', background: 'var(--bg-secondary, #111)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '14px' }}>{f.title}</strong>
                    {f.protocol && <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.6 }}>{(f.protocol as { name: string }).name}</span>}
                  </div>
                  <span style={{ color: statusColors[f.status] || '#888', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>{f.status}</span>
                </div>
              ))
            )}
          </div>

          {/* Active Programs from live data */}
          <div className="ap-section">
            <h2 className="ap-section-title">Active Bounty Programs</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {bounties.length === 0 ? (
                <div className="ap-card" style={{ gridColumn: '1 / -1' }}>
                  <p className="ap-card-text">No active programs found.</p>
                </div>
              ) : bounties.slice(0, 4).map(b => (
                <div key={b.slug} className="ap-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 className="ap-agent-name">{b.name}</h3>
                      <p className="wc-field-helper">{b.description?.slice(0, 60) || 'Bug bounty program'}</p>
                    </div>
                    <span className="sf-protocol-bounty">${Number(b.max_bounty).toLocaleString()}</span>
                  </div>
                  <Link href={`/bounties/${b.slug}`} className="pr-ext-link" style={{ marginTop: 12, display: 'inline-block' }}>
                    View Details →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
