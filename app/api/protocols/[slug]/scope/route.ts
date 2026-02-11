import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/protocols/[slug]/scope — get current scope (public, agents call this)
 * POST /api/protocols/[slug]/scope — publish new scope version (auth required)
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: protocol } = await supabase
    .from('protocols')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

  const { data: program } = await supabase
    .from('programs')
    .select('id, scope_version, poc_required, kyc_required, payout_currency, min_payout, max_payout, exclusions, encryption_public_key')
    .eq('protocol_id', protocol.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!program) return NextResponse.json({ error: 'No active program' }, { status: 404 })

  const { data: scope } = await supabase
    .from('program_scopes')
    .select('*')
    .eq('program_id', program.id)
    .eq('version', program.scope_version)
    .maybeSingle()

  return NextResponse.json({
    protocol: { name: protocol.name, slug: protocol.slug },
    program: {
      poc_required: program.poc_required,
      kyc_required: program.kyc_required,
      payout_currency: program.payout_currency,
      min_payout: program.min_payout,
      max_payout: program.max_payout,
      exclusions: program.exclusions,
      encryption_public_key: program.encryption_public_key,
    },
    scope: scope ? {
      version: scope.version,
      contracts: scope.contracts,
      in_scope: scope.in_scope,
      out_of_scope: scope.out_of_scope,
      severity_definitions: scope.severity_definitions,
    } : null,
  })
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })
  if (!auth.scopes?.includes('protocol:write')) {
    return NextResponse.json({ error: 'Missing protocol:write scope' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const supabase = createClient()

    // Verify membership
    const { data: member } = await supabase
      .from('protocol_members')
      .select('protocol_id, protocols!inner(slug)')
      .eq('user_id', auth.userId)
      .eq('protocols.slug', params.slug)
      .maybeSingle()

    if (!member) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const { data: program } = await supabase
      .from('programs')
      .select('id, scope_version')
      .eq('protocol_id', member.protocol_id)
      .eq('status', 'active')
      .maybeSingle()

    if (!program) return NextResponse.json({ error: 'No active program' }, { status: 404 })

    const newVersion = program.scope_version + 1

    const { data: scope, error } = await supabase
      .from('program_scopes')
      .insert({
        program_id: program.id,
        version: newVersion,
        contracts: body.contracts || [],
        in_scope: body.in_scope || [],
        out_of_scope: body.out_of_scope || [],
        severity_definitions: body.severity_definitions || {},
      })
      .select()
      .single()

    if (error) throw error

    // Update program scope_version
    await supabase
      .from('programs')
      .update({ scope_version: newVersion })
      .eq('id', program.id)

    return NextResponse.json({ scope, message: `Scope v${newVersion} published` }, { status: 201 })
  } catch (error) {
    console.error('Scope publish error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
