import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

async function verifyProtocolAccess(req: NextRequest, slug: string, requiredScopes: string[]) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return { error: 'Missing API key', status: 401 }

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return { error: auth.error || 'Invalid API key', status: 401 }

  for (const scope of requiredScopes) {
    if (!auth.scopes?.includes(scope)) return { error: `Missing scope: ${scope}`, status: 403 }
  }

  const supabase = createClient()
  const { data: membership } = await supabase
    .from('protocol_members')
    .select('role, protocol_id, protocols!inner(slug)')
    .eq('user_id', auth.userId)
    .eq('protocols.slug', slug)
    .maybeSingle()

  if (!membership) return { error: 'Not a member of this protocol', status: 403 }

  return { userId: auth.userId, role: membership.role, protocolId: membership.protocol_id }
}

/**
 * POST /api/protocols/[slug]/program — create bounty program
 * PATCH /api/protocols/[slug]/program — update program (pause, resume, end, update payouts)
 * GET /api/protocols/[slug]/program — get program details
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: protocol } = await supabase
    .from('protocols')
    .select('id, slug, name')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('protocol_id', protocol.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!program) return NextResponse.json({ error: 'No program found' }, { status: 404 })

  return NextResponse.json({ protocol, program })
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const access = await verifyProtocolAccess(req, params.slug, ['protocol:write'])
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })

  const body = await req.json()
  const supabase = createClient()

  const { data: protocol } = await supabase
    .from('protocols')
    .select('id')
    .eq('slug', params.slug)
    .single()

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

  const { data: program, error } = await supabase
    .from('programs')
    .insert({
      protocol_id: protocol.id,
      status: body.status || 'active',
      duplicate_policy: body.duplicate_policy || 'first',
      response_sla_hours: body.response_sla_hours || 72,
      poc_required: body.poc_required ?? true,
      kyc_required: body.kyc_required ?? false,
      payout_currency: body.payout_currency || 'USDC',
      min_payout: body.min_payout || 500,
      max_payout: body.max_payout || 100000,
      encryption_public_key: body.encryption_public_key || null,
      payout_wallet: body.payout_wallet || null,
      exclusions: body.exclusions || [],
      cooldown_hours: body.cooldown_hours || 24,
    })
    .select('id, status, max_payout, created_at')
    .single()

  if (error) throw error

  return NextResponse.json({ program }, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const access = await verifyProtocolAccess(req, params.slug, ['protocol:write'])
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })

  const body = await req.json()
  const supabase = createClient()

  const { data: protocol } = await supabase
    .from('protocols')
    .select('id')
    .eq('slug', params.slug)
    .single()

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

  const updates: Record<string, any> = {}
  const allowed = ['status', 'duplicate_policy', 'response_sla_hours', 'poc_required', 'kyc_required',
    'payout_currency', 'min_payout', 'max_payout', 'encryption_public_key', 'payout_wallet',
    'exclusions', 'cooldown_hours']

  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data: program, error } = await supabase
    .from('programs')
    .update(updates)
    .eq('protocol_id', protocol.id)
    .select('id, status, max_payout, updated_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) throw error

  return NextResponse.json({ program })
}
