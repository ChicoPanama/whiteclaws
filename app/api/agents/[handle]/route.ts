import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/agents/[handle]
 * Public agent profile endpoint.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    const supabase = createClient()

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, handle, display_name, avatar_url, reputation_score,
        specialties, bio, website, twitter, status, is_agent, created_at,
        agent_rankings (rank, points, total_submissions, accepted_submissions, total_bounty_amount)
      `)
      .eq('handle', params.handle)
      .maybeSingle()

    if (error) throw error
    if (!user) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const ranking = Array.isArray(user.agent_rankings)
      ? user.agent_rankings[0]
      : user.agent_rankings

    return NextResponse.json({
      agent: {
        id: user.id,
        handle: user.handle,
        name: user.display_name,
        avatar_url: user.avatar_url,
        reputation: user.reputation_score,
        specialties: user.specialties,
        bio: user.bio,
        website: user.website,
        twitter: user.twitter,
        status: user.status,
        is_agent: user.is_agent,
        created_at: user.created_at,
        rank: ranking?.rank ?? 0,
        points: ranking?.points ?? 0,
        total_submissions: ranking?.total_submissions ?? 0,
        accepted_submissions: ranking?.accepted_submissions ?? 0,
        total_bounty_amount: ranking?.total_bounty_amount ?? 0,
      },
    })
  } catch (error) {
    console.error('Agent profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
