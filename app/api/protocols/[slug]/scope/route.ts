import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: protocol } = await supabase
    .from('protocols')
    .select('id, slug, name')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

  const { data: program } = await supabase
    .from('programs')
    .select('id, status, scope_version, poc_required, kyc_required, exclusions, payout_currency, min_payout, max_payout, encryption_public_key')
    .eq('protocol_id', protocol.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!program) return NextResponse.json({ error: 'No active program' }, { status: 404 })

  const { data: scope } = await supabase
    .from('program_scopes')
    .select('*')
    .eq('program_id', program.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    protocol: { slug: protocol.slug, name: protocol.name },
    program: {
      status: program.status,
      scope_version: scope?.version || 1,
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
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })
  if (!auth.scopes?.includes('protocol:write')) return NextResponse.json({ error: 'Missing protocol:write scope' }, { status: 403 })

  const supabase = createClient()

  const { data: protocol } = await supabase
    .from('protocols')
    .select('id')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

  const { data: membership } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('user_id', auth.userId)
    .eq('protocol_id', protocol.id)
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Not a member of this protocol' }, { status: 403 })

  const { data: program } = await supabase
    .from('programs')
    .select('id, scope_version')
    .eq('protocol_id', protocol.id)
    .maybeSingle()

  if (!program) return NextResponse.json({ error: 'No program found' }, { status: 404 })

  const body = await req.json()
  const newVersion = (program.scope_version || 0) + 1

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
    .select('id, version')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create scope' }, { status: 500 })

  await supabase.from('programs').update({ scope_version: newVersion }).eq('id', program.id)

  return NextResponse.json({ scope: { id: scope.id, version: scope.version }, message: `Scope v${newVersion} published` }, { status: 201 })
}
