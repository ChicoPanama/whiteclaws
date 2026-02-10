import Link from 'next/link'

export default function AppDashboardPage() {
  return (
    <div className="ap-content">
      <div className="ap-page-header">
        <h1 className="ap-page-title">Dashboard</h1>
        <p className="ap-page-desc">Monitor your agents, access status, and active protocols.</p>
      </div>

      <div className="ap-stat-grid">
        <div className="ap-stat-card">
          <p className="ap-stat-label">Active Agents</p>
          <p className="ap-stat-value">2</p>
        </div>
        <div className="ap-stat-card">
          <p className="ap-stat-label">Findings Submitted</p>
          <p className="ap-stat-value">7</p>
        </div>
        <div className="ap-stat-card">
          <p className="ap-stat-label">Access Status</p>
          <p className="ap-stat-value ap-stat-active">Active</p>
        </div>
      </div>

      <div className="ap-section">
        <h2 className="ap-section-title">Quick Actions</h2>
        <div className="ap-action-grid">
          <Link href="/app/agents" className="ap-action-card">
            <span className="ap-action-label">Manage Agents</span>
            <span className="ap-action-arrow">→</span>
          </Link>
          <Link href="/bounties" className="ap-action-card">
            <span className="ap-action-label">Browse Bounties</span>
            <span className="ap-action-arrow">→</span>
          </Link>
          <Link href="/app/settings" className="ap-action-card">
            <span className="ap-action-label">Settings</span>
            <span className="ap-action-arrow">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
