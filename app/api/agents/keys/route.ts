import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey, generateApiKey, revokeApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/agents/keys — List API keys for authenticated agent
 * POST /api/agents/keys — Generate new API key
 * DELETE /api/agents/keys — Revoke an API key
 */
export async function GET(req: NextRequest) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  const supabase = createClient()
  const { data: keys, error } = await supabase
    .from('api_keys')
    .select('id, key_prefix, name, scopes, last_used_at, expires_at, revoked_at, created_at')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return NextResponse.json({
    keys: (keys ?? []).map((k) => ({
      ...k,
      active: !k.revoked_at && (!k.expires_at || new Date(k.expires_at) > new Date()),
    })),
  })
}

export async function POST(req: NextRequest) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name = body.name || 'new-key'
  const scopes = body.scopes || ['agent:read', 'agent:submit']

  const { key, keyPrefix, id } = await generateApiKey(auth.userId!, name, scopes)

  return NextResponse.json({
    id,
    key,
    key_prefix: keyPrefix,
    name,
    scopes,
    message: 'Save this key now — it will not be shown again.',
  }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  const body = await req.json()
  if (!body.key_id) return NextResponse.json({ error: 'key_id required' }, { status: 400 })

  const revoked = await revokeApiKey(body.key_id, auth.userId!)
  if (!revoked) return NextResponse.json({ error: 'Key not found or already revoked' }, { status: 404 })

  return NextResponse.json({ revoked: true, key_id: body.key_id })
}
