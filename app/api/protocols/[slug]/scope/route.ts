import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/protocols/[slug]/scope — get current scope (public, agents use this)
 * POST /api/protocols/[slug]/scope — publish new scope version (protocol team only)
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
    .select('id, scope_version, status, poc_required, kyc_required, exclusions, max_payout, min_payout, payout_currency, encryption_public_key')
    .eq('protocol_id', protocol.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!program) return NextResponse.json({ error: 'No active program' }, { status: 404 })

  const { data: scope } = await supabase
    .from('program_scopes')
    .select('*')
    .eq('program_id', program.id)
    .eq('version', program.scope_version)
    .maybeSingle()

  return NextResponse.json({
    protocol: { slug: protocol.slug, name: protocol.name },
    program: {
      id: program.id,
      status: program.status,
      scope_version: program.scope_version,
      poc_required: program.poc_required,
      kyc_required: program.kyc_required,
      exclusions: program.exclusions,
      max_payout: program.max_payout,
      min_payout: program.min_payout,
      payout_currency: program.payout_currency,
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

  const body = await req.json()
  const supabase = createClient()

  const { data: protocol } = await supabase
    .from('protocols')
    .select('id')
    .eq('slug', params.slug)
    .single()

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

  // Verify membership
  const { data: member } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('protocol_id', protocol.id)
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Get current program
  const { data: program } = await supabase
    .from('programs')
    .select('id, scope_version')
    .eq('protocol_id', protocol.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!program) return NextResponse.json({ error: 'No program found' }, { status: 404 })

  const newVersion = program.scope_version + 1

  // Create new scope
  const { data: scope, error: scopeErr } = await supabase
    .from('program_scopes')
    .insert({
      program_id: program.id,
      version: newVersion,
      contracts: body.contracts || [],
      in_scope: body.in_scope || [],
      out_of_scope: body.out_of_scope || [],
      severity_definitions: body.severity_definitions || {},
    })
    .select('id, version')
    .single()

  if (scopeErr) throw scopeErr

  // Update program scope_version
  await supabase
    .from('programs')
    .update({ scope_version: newVersion })
    .eq('id', program.id)

  return NextResponse.json({
    scope: { id: scope.id, version: scope.version },
    message: `Scope updated to version ${newVersion}`,
  }, { status: 201 })
}
