import { NextRequest, NextResponse } from 'next/server'
import { extractApiKey, verifyApiKey, generateApiKey, revokeApiKey } from '@/lib/auth/api-key'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/rotate-key
 * Rotate agent's current API key. Old key is revoked immediately.
 */
export async function POST(req: NextRequest) {
  try {
    const rawKey = extractApiKey(req)
    if (!rawKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

    const auth = await verifyApiKey(rawKey)
    if (!auth.valid || !auth.userId) {
      return NextResponse.json({ error: auth.error || 'Invalid key' }, { status: 401 })
    }

    const supabase = createClient()

    // Find the current key record to revoke it
    const { data: currentKeys } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', auth.userId)
      .is('revoked_at', null)

    // Generate new key
    const { key, keyPrefix } = await generateApiKey(auth.userId, 'rotated', auth.scopes || ['agent:read', 'agent:submit'])

    // Revoke all old keys
    if (currentKeys) {
      for (const k of currentKeys) {
        await revokeApiKey(k.id, auth.userId)
      }
    }

    return NextResponse.json({
      api_key: key,
      api_key_prefix: keyPrefix,
      message: 'Key rotated. Save this new key — the old key is now invalid.',
    })
  } catch (error) {
    console.error('Key rotation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
