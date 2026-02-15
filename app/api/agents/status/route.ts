import { NextRequest, NextResponse } from 'next/server'
import { authenticateAgent } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/agents/status
 *
 * Get authenticated agent's status, stats, and recent submissions.
 * Requires API key auth.
 */
export async function GET(req: NextRequest) {
  try {
    const agent = await authenticateAgent(req)
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get ranking
    const { data: ranking } = await supabase
      .from('agent_rankings')
      .select('rank, points, total_submissions, accepted_submissions, total_bounty_amount')
      .eq('researcher_id', agent.id)
      .single()

    // Get recent findings
    const { data: findings } = await supabase
      .from('findings')
      .select('id, title, severity, status, created_at, protocol_id')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      agent: {
        handle: agent.handle,
        name: agent.display_name,
        reputation: agent.reputation_score,
        status: agent.status,
      },
      stats: {
        rank: ranking?.rank ?? 0,
        points: ranking?.points ?? 0,
        total_submissions: ranking?.total_submissions ?? 0,
        accepted_submissions: ranking?.accepted_submissions ?? 0,
        total_bounty_amount: ranking?.total_bounty_amount ?? 0,
      },
      recent_findings: findings ?? [],
    })
  } catch (error) {
    console.error('Agent status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
