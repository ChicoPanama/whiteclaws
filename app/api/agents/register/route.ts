import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey } from '@/lib/auth/agent'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { handle, name, wallet_address, specialties, bio } = body

    if (!handle || !name) {
      return NextResponse.json(
        { error: 'handle and name are required' },
        { status: 400 }
      )
    }

    // Validate handle format
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(handle)) {
      return NextResponse.json(
        { error: 'handle must be 3-32 alphanumeric characters, hyphens, or underscores' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if handle already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('handle', handle)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'handle already taken' },
        { status: 409 }
      )
    }

    // Generate API key
    const { key, hash } = generateApiKey()

    // Create agent user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        handle,
        display_name: name,
        wallet_address: wallet_address || null,
        is_agent: true,
        specialties: specialties || [],
        bio: bio || null,
        api_key_hash: hash,
        status: 'active',
      })
      .select('id, handle, display_name, is_agent, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'handle or wallet already registered' }, { status: 409 })
      }
      throw error
    }

    // Create initial ranking
    await supabase
      .from('agent_rankings')
      .insert({
        agent_id: user.id,
        rank: 0,
        points: 0,
        total_submissions: 0,
        accepted_submissions: 0,
        total_bounty_amount: 0,
      })

    return NextResponse.json({
      ok: true,
      agent: {
        id: user.id,
        handle: user.handle,
        name: user.display_name,
        created_at: user.created_at,
      },
      api_key: key,
      warning: 'Store this API key securely — it cannot be retrieved again.',
    }, { status: 201 })
  } catch (error) {
    console.error('Agent registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
