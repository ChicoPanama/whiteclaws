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

export async function getResearchers(): Promise<ResearcherEntry[]> {
  if (!hasSupabaseConfig) {
    return []
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('agent_rankings')
    .select('agent_id, points, total_submissions, total_bounty_amount, users (handle)')
    .order('points', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((entry: any, index: number) => {
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
