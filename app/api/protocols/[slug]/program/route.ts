import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

async function getProtocolBySlug(supabase: any, slug: string) {
  const { data } = await supabase
    .from('protocols')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle()
  return data
}

async function verifyProtocolAccess(supabase: any, protocolId: string, userId: string, requiredRoles: string[] = ['owner', 'admin']) {
  const { data } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('protocol_id', protocolId)
    .eq('user_id', userId)
    .maybeSingle()
  return data && requiredRoles.includes(data.role)
}

/**
 * POST /api/protocols/[slug]/program — create bounty program
 * PATCH /api/protocols/[slug]/program — update program (pause, resume, update payouts)
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

    const supabase = createClient()
    const protocol = await getProtocolBySlug(supabase, params.slug)
    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const hasAccess = await verifyProtocolAccess(supabase, protocol.id, auth.userId!)
    if (!hasAccess) return NextResponse.json({ error: 'Not a protocol admin' }, { status: 403 })

    const body = await req.json()

    const { data: program, error } = await supabase
      .from('programs')
      .insert({
        protocol_id: protocol.id,
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
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ program }, { status: 201 })
  } catch (error) {
    console.error('Create program error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

    const supabase = createClient()
    const protocol = await getProtocolBySlug(supabase, params.slug)
    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const hasAccess = await verifyProtocolAccess(supabase, protocol.id, auth.userId!)
    if (!hasAccess) return NextResponse.json({ error: 'Not a protocol admin' }, { status: 403 })

    const body = await req.json()
    const allowedFields = ['status', 'duplicate_policy', 'response_sla_hours', 'poc_required',
      'kyc_required', 'payout_currency', 'min_payout', 'max_payout', 'encryption_public_key',
      'payout_wallet', 'exclusions', 'cooldown_hours']

    const updates: any = {}
    for (const f of allowedFields) {
      if (body[f] !== undefined) updates[f] = body[f]
    }

    const { data: program, error } = await supabase
      .from('programs')
      .update(updates)
      .eq('protocol_id', protocol.id)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Update program error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createClient()
  const protocol = await getProtocolBySlug(supabase, params.slug)
  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('protocol_id', protocol.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!program) return NextResponse.json({ error: 'No active program' }, { status: 404 })

  return NextResponse.json({ program })
}
