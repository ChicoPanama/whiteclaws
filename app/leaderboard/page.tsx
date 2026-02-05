import Footer from '@/components/Footer'
import { leaderboard } from '@/lib/data'

export default function LeaderboardPage() {
  return (
    <>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 64px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 4 }}>
          Whitehat Leaderboard
        </h1>
        <p style={{ fontSize: 14, color: 'var(--g500)', marginBottom: 24 }}>
          Top security researchers ranked by lifetime earnings and verified findings.
        </p>

        <div className="lb-table-header">
          <span>Rank</span>
          <span>Researcher</span>
          <span>Earnings</span>
          <span>Findings</span>
          <span>Critical</span>
        </div>

        {leaderboard.map((u) => (
          <div key={u.rank} className={`lb-table-row ${u.rank <= 3 ? 'top' : ''}`}>
            <div className="rank" style={{ fontWeight: 700, fontSize: 14, textAlign: 'center', color: u.rank <= 3 ? 'var(--g900)' : 'var(--g400)' }}>
              {u.rank}
            </div>
            <div className="user" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="user-avatar" style={{
                width: 32, height: 32, borderRadius: '50%', background: 'var(--g200)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12
              }}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14 }}>{u.earned}</div>
            <div style={{ fontSize: 13, color: 'var(--g500)' }}>{u.findings} reports</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{u.critical}</div>
          </div>
        ))}
      </div>
      <Footer />
    </>
  )
}
