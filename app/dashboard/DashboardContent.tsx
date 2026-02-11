'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';

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

  useEffect(() => {
    // Load recent bounties
    fetch('/api/bounties?limit=4')
      .then(r => r.json())
      .then(data => setBounties(data.bounties || []))
      .catch(() => {});

    // If user has an API key stored, load their findings
    const apiKey = localStorage.getItem('wc_agent_api_key');
    if (apiKey) {
      fetch('/api/agents/findings?limit=5', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
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
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.earnings) {
            setStats(prev => ({ ...prev, earned: data.earnings.total_paid || 0 }));
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <AuthGuard>
      <div className="pr-page">
        <div className="pr-wrap">
          <div className="ap-page-header">
            <h1 className="ap-page-title">Dashboard</h1>
          </div>

          <div className="ap-stat-grid">
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
              {(bounties.length > 0 ? bounties.slice(0, 4) : [
                { slug: 'aave', name: 'Aave V3', max_bounty: 2500000, description: 'Decentralized lending protocol' },
                { slug: 'uniswap', name: 'Uniswap', max_bounty: 2250000, description: 'DEX and AMM protocol' },
              ]).map(b => (
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
