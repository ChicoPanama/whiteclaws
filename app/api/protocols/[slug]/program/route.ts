import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      .select('id, slug, name')
      .eq('slug', params.slug!)
      .returns<Row<'protocols'>[]>().maybeSingle()

    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const { data: program } = await supabase
      .from('programs')
      .select('*')
      .eq('protocol_id', protocol.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .returns<Row<'programs'>[]>().maybeSingle()

    if (!program) return NextResponse.json({ error: 'No program found' }, { status: 404 })

    return NextResponse.json({ protocol, program })
  } catch (error) {
    console.error('Program GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const auth = await verifyApiKey(apiKey)
    if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error || 'Invalid' }, { status: 401 })
    if (!auth.scopes || !auth.scopes.includes('protocol:write')) {
      return NextResponse.json({ error: 'Missing protocol:write scope' }, { status: 403 })
    }

    const body = await req.json()
    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      .select('id')
      .eq('slug', params.slug!)
      .returns<Row<'protocols'>[]>().single()

    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', protocol.id)
      .eq('user_id', auth.userId!)
      .returns<Row<'protocol_members'>[]>().maybeSingle()

    if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

    const { data: program, error } = await supabase
      .from('programs')
      .insert({
        protocol_id: protocol.id,
        status: body.status || 'active',
        duplicate_policy: body.duplicate_policy || 'first',
        response_sla_hours: body.response_sla_hours || 72,
        poc_required: body.poc_required !== undefined ? body.poc_required : true,
        kyc_required: body.kyc_required !== undefined ? body.kyc_required : false,
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
  } catch (error) {
    console.error('Program POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error || 'Invalid' }, { status: 401 })

    const body = await req.json()
    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      .select('id')
      .eq('slug', params.slug!)
      .returns<Row<'protocols'>[]>().single()

    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', protocol.id)
      .eq('user_id', auth.userId!)
      .returns<Row<'protocol_members'>[]>().maybeSingle()

    if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {}
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
      .returns<Row<'programs'>[]>().single()

    if (error) throw error

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Program PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
