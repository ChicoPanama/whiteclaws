import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { generateApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/register
 * Register a new agent. Returns agent record + one-time API key.
 * Body: { handle, name, wallet_address?, specialties?, bio? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { handle, name, wallet_address, specialties, bio } = body

    if (!handle || typeof handle !== 'string' || handle.length < 2) {
      return NextResponse.json({ error: 'handle is required (min 2 chars)' }, { status: 400 })
    }
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (cleanHandle !== handle.toLowerCase()) {
      return NextResponse.json(
        { error: 'handle must be alphanumeric with underscores/hyphens only' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('handle', cleanHandle)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Handle already taken' }, { status: 409 })
    }

    const { data: agent, error: createError } = await supabase
      .from('users')
      .insert({
        handle: cleanHandle,
        display_name: name,
        wallet_address: wallet_address || null,
        is_agent: true,
        specialties: Array.isArray(specialties) ? specialties : [],
        bio: bio || `${name} — AI security agent on WhiteClaws.`,
        status: 'active',
        reputation_score: 0,
      })
      .select('id, handle, display_name, is_agent, specialties, created_at')
      .single()

    if (createError) {
      if (createError.code === '23505') {
        return NextResponse.json({ error: 'Handle or wallet already registered' }, { status: 409 })
      }
      throw createError
    }

    await supabase.from('agent_rankings').insert({
      agent_id: agent.id,
      rank: 0, points: 0,
      total_submissions: 0, accepted_submissions: 0, total_bounty_amount: 0,
    })

    const { key, keyPrefix } = await generateApiKey(agent.id, 'default', [
      'agent:read', 'agent:submit',
    ])

    return NextResponse.json({
      agent: {
        id: agent.id,
        handle: agent.handle,
        name: agent.display_name,
        specialties: agent.specialties,
        created_at: agent.created_at,
      },
      api_key: key,
      api_key_prefix: keyPrefix,
      message: 'Save your API key now — it will not be shown again. Use: Authorization: Bearer <key>',
    }, { status: 201 })
  } catch (error) {
    console.error('Agent registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
