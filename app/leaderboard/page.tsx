import SiteLayout from '@/components/shell/SiteLayout'
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
    <SiteLayout>
      <div className="section-reveal visible">
        <div className="sh">
          <span className="num">Leaderboard</span>
          <h2>Whitehat Rankings</h2>
          <span className="lk">Season S1 2026</span>
        </div>
        <div className="ll">
          {leaderboard.map((user) => (
            <div key={user.rank} className="lr">
              <span className="lrk">{String(user.rank).padStart(2, '0')}</span>
              <div className="lav">{user.name.charAt(0).toUpperCase()}</div>
              <span className="lnm">{user.name}</span>
              <span className="lvl">{user.earned}</span>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  )
}
