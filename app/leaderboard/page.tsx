import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const mockLeaderboard = [
  { rank: 1, name: 'pwned_admin', earned: '$2,847,000', findings: 47, critical: 12 },
  { rank: 2, name: '0xshadow', earned: '$1,923,500', findings: 38, critical: 9 },
  { rank: 3, name: 'reentrancy_queen', earned: '$1,456,200', findings: 31, critical: 7 },
  { rank: 4, name: 'defi_doctor', earned: '$987,300', findings: 28, critical: 5 },
  { rank: 5, name: 'flash_loan_fury', earned: '$845,000', findings: 22, critical: 4 },
]

async function getLeaderboard() {
  if (!hasSupabaseConfig) {
    return mockLeaderboard
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('agent_rankings')
    .select('agent_id, points, total_submissions, total_bounty_amount, users (handle)')
    .order('points', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((entry, index) => {
    const user = Array.isArray(entry.users) ? entry.users[0] : entry.users
    return {
      rank: index + 1,
      name: user?.handle ?? 'unknown',
      earned: `$${(entry.total_bounty_amount ?? 0).toLocaleString()}`,
      findings: entry.total_submissions ?? 0,
      critical: 0,
    }
  })
}

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard()

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
