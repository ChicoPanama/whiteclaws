import { NextRequest, NextResponse } from 'next/server'
import { authenticateAgent } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateApiKey } from '@/lib/auth/apikey'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/rotate-key
 *
 * Rotate an agent's API key. Requires current key for auth.
 * Returns new key. Old key is immediately invalidated.
 */
export async function POST(req: NextRequest) {
  try {
    const agent = await authenticateAgent(req)
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { raw, hash, prefix } = generateApiKey()

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('users')
      .update({ api_key_hash: hash, api_key_prefix: prefix })
      .eq('id', agent.id)

    if (error) throw error

    return NextResponse.json({
      api_key: raw,
      message: 'Key rotated. Save this new key — the old key is now invalid.',
    })
  } catch (error) {
    console.error('Key rotation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
