import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

async function verifyProtocolAccess(req: NextRequest, slug: string, requiredScope: string) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return { error: 'Missing API key', status: 401 }

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid || !auth.userId) return { error: auth.error, status: 401 }
  if (!auth.scopes?.includes(requiredScope)) return { error: `Requires ${requiredScope} scope`, status: 403 }

  const supabase = createClient()

  const { data: protocol } = await supabase
    .from('protocols')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle()

  if (!protocol) return { error: 'Protocol not found', status: 404 }

  const { data: membership } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('protocol_id', protocol.id)
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!membership) return { error: 'Not a member of this protocol', status: 403 }

  return { auth, protocol, membership, supabase }
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

  if (!program) return NextResponse.json({ error: 'No bounty program found' }, { status: 404 })

  const { data: scope } = await supabase
    .from('program_scopes')
    .select('*')
    .eq('program_id', program.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ protocol, program, current_scope: scope })
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const access = await verifyProtocolAccess(req, params.slug, 'protocol:write')
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })

  const { supabase, protocol } = access
  const body = await req.json()

  const { data: program } = await supabase
    .from('programs')
    .select('id')
    .eq('protocol_id', protocol.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!program) return NextResponse.json({ error: 'No program found' }, { status: 404 })

  const allowed = ['status', 'duplicate_policy', 'response_sla_hours', 'poc_required', 'kyc_required',
    'payout_currency', 'min_payout', 'max_payout', 'encryption_public_key', 'payout_wallet',
    'exclusions', 'cooldown_hours']

  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('programs')
    .update(updates)
    .eq('id', program.id)
    .select('id, status, payout_currency, min_payout, max_payout, updated_at')
    .single()

  if (error) throw error

  return NextResponse.json({ program: data, message: 'Program updated' })
}
