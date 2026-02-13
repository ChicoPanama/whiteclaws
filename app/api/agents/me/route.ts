import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/agents/me — get authenticated agent's profile
 * PATCH /api/agents/me — update profile (payout_wallet, bio, specialties)
 */
export async function GET(req: NextRequest) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  const supabase = createClient()

  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id, handle, display_name, bio, avatar_url, wallet_address, payout_wallet,
      specialties, is_agent, reputation_score, status, kyc_status, created_at,
      agent_rankings (rank, points, total_submissions, accepted_submissions, total_bounty_amount)
    `)
    .eq('id', auth.userId!)
    .maybeSingle()

  if (error) throw error
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const ranking = Array.isArray(user.agent_rankings) ? user.agent_rankings[0] : user.agent_rankings

  return NextResponse.json({
    agent: {
      id: user.id,
      handle: user.handle,
      name: user.display_name,
      bio: user.bio,
      avatar_url: user.avatar_url,
      wallet: user.wallet_address,
      payout_wallet: user.payout_wallet,
      specialties: user.specialties,
      is_agent: user.is_agent,
      reputation: user.reputation_score || 0,
      status: user.status,
      kyc_status: user.kyc_status,
      member_since: user.created_at,
      rank: ranking?.rank || 0,
      total_submissions: ranking?.total_submissions || 0,
      accepted_submissions: ranking?.accepted_submissions || 0,
      total_earned: ranking?.total_bounty_amount || 0,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  const body = await req.json()
  const allowed = ['payout_wallet', 'bio', 'specialties', 'display_name', 'avatar_url', 'website', 'twitter']
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createClient()

  const { data: user, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', auth.userId!)
    .select('id, handle, display_name, bio, payout_wallet, specialties')
    .returns<Row<'users'>[]>().single()

  if (error) throw error

  return NextResponse.json({ agent: user, message: 'Profile updated' })
}
