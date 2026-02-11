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

  return { protocol, userId: auth.userId, role: membership.role, supabase }
}

/**
 * POST /api/protocols/[slug]/program
 * Create a bounty program with scope, payouts, and rules.
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const access = await verifyProtocolAccess(req, params.slug, ['protocol:write'])
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })

    const { protocol, supabase } = access
    const body = await req.json()

    // Check no existing program
    const { data: existing } = await supabase
      .from('programs')
      .select('id')
      .eq('protocol_id', protocol.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Program already exists. Use PATCH to update.' }, { status: 409 })
    }

    const {
      max_payout, min_payout, payout_currency, poc_required, kyc_required,
      duplicate_policy, response_sla_hours, payout_wallet, exclusions,
      encryption_public_key, cooldown_hours,
      // Initial scope
      contracts, in_scope, out_of_scope, severity_definitions,
    } = body

    // Create program
    const { data: program, error: progErr } = await supabase
      .from('programs')
      .insert({
        protocol_id: protocol.id,
        status: 'active',
        scope_version: 1,
        max_payout: max_payout || 1000000,
        min_payout: min_payout || 500,
        payout_currency: payout_currency || 'USDC',
        poc_required: poc_required ?? true,
        kyc_required: kyc_required ?? false,
        duplicate_policy: duplicate_policy || 'first',
        response_sla_hours: response_sla_hours || 72,
        payout_wallet: payout_wallet || null,
        exclusions: exclusions || [],
        encryption_public_key: encryption_public_key || null,
        cooldown_hours: cooldown_hours || 24,
      })
      .select('id, status, scope_version')
      .single()

    if (progErr) throw progErr

    // Create initial scope (version 1)
    await supabase.from('program_scopes').insert({
      program_id: program.id,
      version: 1,
      contracts: contracts || [],
      in_scope: in_scope || [],
      out_of_scope: out_of_scope || [],
      severity_definitions: severity_definitions || undefined,
    })

    // Update protocol max_bounty
    if (max_payout) {
      await supabase.from('protocols').update({ max_bounty: max_payout }).eq('id', protocol.id)
    }

    return NextResponse.json({
      program: { id: program.id, status: program.status, scope_version: program.scope_version },
      protocol: { slug: protocol.slug, name: protocol.name },
      message: 'Bounty program created and active. Agents can now discover it via GET /api/bounties.',
    }, { status: 201 })
  } catch (error) {
    console.error('Program creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/protocols/[slug]/program
 * Update program: pause, resume, end, update payouts.
 */
export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const access = await verifyProtocolAccess(req, params.slug, ['protocol:write'])
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })

    const { protocol, supabase } = access
    const body = await req.json()

    const allowedFields = [
      'status', 'max_payout', 'min_payout', 'payout_currency', 'poc_required',
      'kyc_required', 'duplicate_policy', 'response_sla_hours', 'payout_wallet',
      'exclusions', 'encryption_public_key', 'cooldown_hours',
    ]

    const updates: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('programs')
      .update(updates)
      .eq('protocol_id', protocol.id)
      .select('id, status, max_payout, min_payout, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ program: data })
  } catch (error) {
    console.error('Program update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/protocols/[slug]/program
 * Public: get program details.
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      .select('id, slug, name, category, chains, logo_url, max_bounty, description, website_url, github_url')
      .eq('slug', params.slug)
      .maybeSingle()

    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const { data: program } = await supabase
      .from('programs')
      .select('*')
      .eq('protocol_id', protocol.id)
      .maybeSingle()

    if (!program) return NextResponse.json({ error: 'No bounty program for this protocol' }, { status: 404 })

    const { data: scope } = await supabase
      .from('program_scopes')
      .select('*')
      .eq('program_id', program.id)
      .eq('version', program.scope_version)
      .maybeSingle()

    return NextResponse.json({
      protocol,
      program: {
        id: program.id,
        status: program.status,
        scope_version: program.scope_version,
        poc_required: program.poc_required,
        kyc_required: program.kyc_required,
        duplicate_policy: program.duplicate_policy,
        response_sla_hours: program.response_sla_hours,
        payout_currency: program.payout_currency,
        min_payout: program.min_payout,
        max_payout: program.max_payout,
        exclusions: program.exclusions,
        cooldown_hours: program.cooldown_hours,
      },
      scope: scope || null,
    })
  } catch (error) {
    console.error('Program fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
