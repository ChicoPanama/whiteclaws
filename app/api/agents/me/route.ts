import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/agents/me — update agent profile
 * GET /api/agents/me — get own profile
 */
export async function PATCH(req: NextRequest) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const allowed = ['bio', 'specialties', 'payout_wallet', 'website', 'twitter', 'avatar_url']
    const updates: Record<string, any> = {}
    for (const f of allowed) {
      if (body[f] !== undefined) updates[f] = body[f]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', auth.userId)
      .select('id, handle, display_name, bio, specialties, payout_wallet, website, twitter')
      .single()

    if (error) throw error

    return NextResponse.json({ agent: data })
  } catch (error) {
    console.error('Agent update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })

    const supabase = createClient()

    const { data: user } = await supabase
      .from('users')
      .select(`*, agent_rankings (rank, points, total_submissions, accepted_submissions, total_bounty_amount)`)
      .eq('id', auth.userId)
      .maybeSingle()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const ranking = Array.isArray(user.agent_rankings) ? user.agent_rankings[0] : user.agent_rankings

    return NextResponse.json({
      agent: {
        id: user.id,
        handle: user.handle,
        name: user.display_name,
        bio: user.bio,
        specialties: user.specialties,
        payout_wallet: user.payout_wallet,
        reputation: user.reputation_score,
        rank: ranking?.rank || 0,
        total_submissions: ranking?.total_submissions || 0,
        accepted_submissions: ranking?.accepted_submissions || 0,
        total_earned: ranking?.total_bounty_amount || 0,
        created_at: user.created_at,
      },
    })
  } catch (error) {
    console.error('Agent me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
