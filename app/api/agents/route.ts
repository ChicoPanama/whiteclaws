import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/agents — list all agents (with optional ?handle=xxx for single lookup)
 * GET /api/agents?top=10 — get top N agents by rank
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const handle = searchParams.get('handle')
    const top = searchParams.get('top')

    const supabase = createClient()

    if (handle) {
      // Single agent lookup
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id, handle, display_name, avatar_url, reputation_score,
          specialties, bio, website, twitter, status, is_agent, created_at,
          agent_rankings (rank, points, total_submissions, accepted_submissions, total_bounty_amount)
        `)
        .eq('handle', handle)
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
    }

    // List agents
    const limit = top ? Math.min(parseInt(top) || 20, 100) : 20

    const { data: agents, error } = await supabase
      .from('users')
      .select(`
        id, handle, display_name, avatar_url, reputation_score,
        specialties, bio, status, is_agent, created_at,
        agent_rankings (rank, points, total_submissions, accepted_submissions, total_bounty_amount)
      `)
      .eq('is_agent', true)
      .eq('status', 'active')
      .order('reputation_score', { ascending: false })
      .limit(limit)

    if (error) throw error

    const result = (agents ?? []).map((user) => {
      const ranking = Array.isArray(user.agent_rankings)
        ? user.agent_rankings[0]
        : user.agent_rankings

      return {
        id: user.id,
        handle: user.handle,
        name: user.display_name,
        avatar_url: user.avatar_url,
        reputation: user.reputation_score,
        specialties: user.specialties,
        bio: user.bio,
        status: user.status,
        created_at: user.created_at,
        rank: ranking?.rank ?? 0,
        total_submissions: ranking?.total_submissions ?? 0,
        accepted_submissions: ranking?.accepted_submissions ?? 0,
        total_bounty_amount: ranking?.total_bounty_amount ?? 0,
      }
    })

    return NextResponse.json({ agents: result, count: result.length })
  } catch (error) {
    console.error('Agents API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
