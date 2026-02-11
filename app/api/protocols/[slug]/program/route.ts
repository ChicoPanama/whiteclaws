import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

async function verifyProtocolAccess(req: NextRequest, slug: string, requiredScopes: string[]) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return { error: 'Missing API key', status: 401 }

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return { error: auth.error, status: 401 }

  for (const scope of requiredScopes) {
    if (!auth.scopes?.includes(scope)) {
      return { error: `Missing scope: ${scope}`, status: 403 }
    }
  }

  const supabase = createClient()
  const { data: member } = await supabase
    .from('protocol_members')
    .select('role, protocol_id, protocols!inner(slug)')
    .eq('user_id', auth.userId)
    .eq('protocols.slug', slug)
    .maybeSingle()

  if (!member) return { error: 'Not a member of this protocol', status: 403 }

  return { userId: auth.userId, role: member.role, protocolId: member.protocol_id }
}

/**
 * POST /api/protocols/[slug]/program — create bounty program
 * PATCH /api/protocols/[slug]/program — update program settings
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const access = await verifyProtocolAccess(req, params.slug, ['protocol:write'])
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })

  try {
    const body = await req.json()
    const supabase = createClient()

    const { data: existing } = await supabase
      .from('programs')
      .select('id')
      .eq('protocol_id', access.protocolId)
      .eq('status', 'active')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Active program already exists. Use PATCH to update.' }, { status: 409 })
    }

    const { data: program, error } = await supabase
      .from('programs')
      .insert({
        protocol_id: access.protocolId,
        status: 'active',
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
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ program }, { status: 201 })
  } catch (error) {
    console.error('Program creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const access = await verifyProtocolAccess(req, params.slug, ['protocol:write'])
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })

  try {
    const body = await req.json()
    const supabase = createClient()

    const allowedFields = [
      'status', 'duplicate_policy', 'response_sla_hours', 'poc_required',
      'kyc_required', 'payout_currency', 'min_payout', 'max_payout',
      'encryption_public_key', 'payout_wallet', 'exclusions', 'cooldown_hours',
    ]
    const updates: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: program, error } = await supabase
      .from('programs')
      .update(updates)
      .eq('protocol_id', access.protocolId)
      .neq('status', 'ended')
      .select()
      .single()

    if (error) throw error
    if (!program) return NextResponse.json({ error: 'No active program found' }, { status: 404 })

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Program update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: protocol } = await supabase
    .from('protocols')
    .select('id')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('protocol_id', protocol.id)
    .neq('status', 'ended')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!program) return NextResponse.json({ error: 'No active program' }, { status: 404 })

  return NextResponse.json({ program })
}
