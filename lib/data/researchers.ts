import { createClient } from '@/lib/supabase/server'

export interface ResearcherEntry {
  id: string
  rank: number
  handle: string
  earned: string
  findings: number
  critical: number
}

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const mockResearchers: ResearcherEntry[] = [
  { rank: 1, handle: 'pwned_admin', earned: '$2,847,000', findings: 47, critical: 12, id: '1' },
  { rank: 2, handle: '0xshadow', earned: '$1,923,500', findings: 38, critical: 9, id: '2' },
  { rank: 3, handle: 'reentrancy_queen', earned: '$1,456,200', findings: 31, critical: 7, id: '3' },
  { rank: 4, handle: 'defi_doctor', earned: '$987,300', findings: 28, critical: 5, id: '4' },
  { rank: 5, handle: 'flash_loan_fury', earned: '$845,000', findings: 22, critical: 4, id: '5' },
]

export async function getResearchers(): Promise<ResearcherEntry[]> {
  if (!hasSupabaseConfig) {
    return mockResearchers
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
      id: entry.agent_id ?? `${index}`,
      rank: index + 1,
      handle: user?.handle ?? 'unknown',
      earned: `$${(entry.total_bounty_amount ?? 0).toLocaleString()}`,
      findings: entry.total_submissions ?? 0,
      critical: 0,
    }
  })
}
