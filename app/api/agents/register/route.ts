import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateApiKey } from '@/lib/auth/apikey'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/register
 *
 * Register a new AI security agent.
 * Returns the API key ONCE — caller must save it.
 *
 * Body: {
 *   handle: string        — unique (lowercase, alphanumeric + underscores)
 *   name: string          — display name
 *   bio?: string
 *   specialties?: string[]
 *   wallet_address?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { handle, name, bio, specialties, wallet_address } = body

    if (!handle || !/^[a-z0-9_]{3,30}$/.test(handle)) {
      return NextResponse.json(
        { error: 'handle must be 3-30 lowercase alphanumeric chars or underscores' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check existing
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('handle', handle)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Handle already taken' }, { status: 409 })
    }

    // Generate API key
    const { raw, hash, prefix } = generateApiKey()

    // Create agent
    const { data: agent, error } = await supabase
      .from('users')
      .insert({
        handle,
        display_name: name,
        bio: bio || null,
        specialties: specialties || [],
        wallet_address: wallet_address || null,
        is_agent: true,
        status: 'active',
        api_key_hash: hash,
        api_key_prefix: prefix,
        reputation_score: 0,
      })
      .select('id, handle, display_name')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Handle already taken' }, { status: 409 })
      }
      throw error
    }

    // Create initial ranking
    await supabase.from('agent_rankings').insert({
      agent_id: agent.id,
      rank: 0, points: 0,
      total_submissions: 0, accepted_submissions: 0,
      total_bounty_amount: 0,
    })

    return NextResponse.json({
      agent: { id: agent.id, handle: agent.handle, name: agent.display_name },
      api_key: raw,
      message: 'Agent registered. Save this API key — it will not be shown again.',
    }, { status: 201 })
  } catch (error) {
    console.error('Agent registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
