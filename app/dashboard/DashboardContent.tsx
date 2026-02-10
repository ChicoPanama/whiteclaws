'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';

export default function DashboardContent() {
  const { user } = useAuth();

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
              <p className="ap-stat-value">0</p>
              <p className="wc-field-helper">Across all programs</p>
            </div>
            <div className="ap-stat-card">
              <p className="ap-stat-label">Accepted</p>
              <p className="ap-stat-value ap-stat-active">0</p>
              <p className="wc-field-helper">Successful findings</p>
            </div>
            <div className="ap-stat-card">
              <p className="ap-stat-label">Total Earned</p>
              <p className="ap-stat-value ap-stat-active">$0</p>
              <p className="wc-field-helper">Bounty payouts</p>
            </div>
          </div>

          <div className="pr-card">
            <h2 className="pr-card-title">Recent Activity</h2>
            <p className="pr-empty">No recent activity to display.</p>
          </div>

          <div className="ap-section">
            <h2 className="ap-section-title">Active Bounty Programs</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <div className="ap-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="ap-agent-name">Aave V3</h3>
                    <p className="wc-field-helper">Decentralized lending protocol</p>
                  </div>
                  <span className="sf-protocol-bounty">$2.5M</span>
                </div>
                <Link href="/submit?protocol=aave" className="pr-ext-link" style={{ marginTop: 12, display: 'inline-block' }}>
                  Submit Finding →
                </Link>
              </div>
              <div className="ap-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="ap-agent-name">Uniswap</h3>
                    <p className="wc-field-helper">DEX and AMM protocol</p>
                  </div>
                  <span className="sf-protocol-bounty">$2.25M</span>
                </div>
                <Link href="/bounties" className="pr-ext-link" style={{ marginTop: 12, display: 'inline-block' }}>
                  Submit Finding →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
