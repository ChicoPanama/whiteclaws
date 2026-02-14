import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'
import { requireProtocolAdmin, requireSessionUserId } from '@/lib/auth/protocol-guards'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const programCreateSchema = z.object({
  status: z.string().optional(),
  duplicate_policy: z.string().optional(),
  response_sla_hours: z.number().int().min(1).max(24 * 365).optional(),
  poc_required: z.boolean().optional(),
  kyc_required: z.boolean().optional(),
  payout_currency: z.string().max(16).optional(),
  min_payout: z.number().nonnegative().optional(),
  max_payout: z.number().nonnegative().optional(),
  encryption_public_key: z.string().optional().nullable(),
  payout_wallet: z.string().optional().nullable(),
  exclusions: z.array(z.string()).optional(),
  cooldown_hours: z.number().int().min(0).max(24 * 365).optional(),
})

const programPatchSchema = programCreateSchema.partial()

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
    const session = await requireSessionUserId()
    if (!session.ok) return session.res

    const body = await req.json().catch(() => ({}))
    const parsedBody = programCreateSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Validation error', details: parsedBody.error.issues }, { status: 400 })
    }

    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      .select('id')
      .eq('slug', params.slug!)
      .returns<Row<'protocols'>[]>().single()

    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const authz = await requireProtocolAdmin(session.userId, protocol.id)
    if (!authz.ok) return authz.res

    const { data: program, error } = await supabase
      .from('programs')
      .insert({
        protocol_id: protocol.id,
        status: parsedBody.data.status || 'active',
        duplicate_policy: parsedBody.data.duplicate_policy || 'first',
        response_sla_hours: parsedBody.data.response_sla_hours || 72,
        poc_required: parsedBody.data.poc_required !== undefined ? parsedBody.data.poc_required : true,
        kyc_required: parsedBody.data.kyc_required !== undefined ? parsedBody.data.kyc_required : false,
        payout_currency: parsedBody.data.payout_currency || 'USDC',
        min_payout: parsedBody.data.min_payout || 500,
        max_payout: parsedBody.data.max_payout || 100000,
        encryption_public_key: parsedBody.data.encryption_public_key || null,
        payout_wallet: parsedBody.data.payout_wallet || null,
        exclusions: parsedBody.data.exclusions || [],
        cooldown_hours: parsedBody.data.cooldown_hours || 24,
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
    const session = await requireSessionUserId()
    if (!session.ok) return session.res

    const body = await req.json().catch(() => ({}))
    const parsedBody = programPatchSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Validation error', details: parsedBody.error.issues }, { status: 400 })
    }
    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      .select('id')
      .eq('slug', params.slug!)
      .returns<Row<'protocols'>[]>().single()

    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const authz = await requireProtocolAdmin(session.userId, protocol.id)
    if (!authz.ok) return authz.res

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {}
    const allowed = ['status', 'duplicate_policy', 'response_sla_hours', 'poc_required', 'kyc_required',
      'payout_currency', 'min_payout', 'max_payout', 'encryption_public_key', 'payout_wallet',
      'exclusions', 'cooldown_hours']

    for (const key of allowed) {
      if ((parsedBody.data as any)[key] !== undefined) updates[key] = (parsedBody.data as any)[key]
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
