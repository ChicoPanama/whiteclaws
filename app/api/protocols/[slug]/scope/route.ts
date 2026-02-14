import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'
import { requireProtocolAdmin, requireSessionUserId } from '@/lib/auth/protocol-guards'
import { fireEvent } from '@/lib/points/hooks'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const scopePublishSchema = z.object({
  contracts: z.array(z.any()).optional(),
  in_scope: z.array(z.string()).optional(),
  out_of_scope: z.array(z.string()).optional(),
  severity_definitions: z.record(z.string(), z.any()).optional(),
})

/**
 * GET /api/protocols/[slug]/scope — get current scope (public, agents use this)
 * POST /api/protocols/[slug]/scope — publish new scope version (protocol team only)
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: protocol } = await supabase
    .from('protocols')
    .select('id, slug, name')
    .eq('slug', params.slug!)
    .returns<Row<'protocols'>[]>().maybeSingle()

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

  const { data: program } = await supabase
    .from('programs')
    .select('id, scope_version, status, poc_required, kyc_required, exclusions, max_payout, min_payout, payout_currency, encryption_public_key')
    .eq('protocol_id', protocol.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .returns<Row<'programs'>[]>().maybeSingle()

  if (!program) return NextResponse.json({ error: 'No active program' }, { status: 404 })

  const { data: scope } = await supabase
    .from('program_scopes')
    .select('*')
    .eq('program_id', program.id)
    .eq('version', program.scope_version)
    .returns<Row<'program_scopes'>[]>().maybeSingle()

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
  const session = await requireSessionUserId()
  if (!session.ok) return session.res

  const body = await req.json().catch(() => ({}))
  const parsedBody = scopePublishSchema.safeParse(body)
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

  // Get current program
  const { data: program } = await supabase
    .from('programs')
    .select('id, scope_version')
    .eq('protocol_id', protocol.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .returns<Row<'programs'>[]>().single()

  if (!program) return NextResponse.json({ error: 'No program found' }, { status: 404 })

  const newVersion = program.scope_version + 1

  // Create new scope
  const { data: scope, error: scopeErr } = await supabase
    .from('program_scopes')
    .insert({
      program_id: program.id,
      version: newVersion,
      contracts: (parsedBody.data.contracts || []) as any,
      in_scope: parsedBody.data.in_scope || [],
      out_of_scope: parsedBody.data.out_of_scope || [],
      severity_definitions: (parsedBody.data.severity_definitions || {}) as any,
    })
    .select('id, version')
    .single()

  if (scopeErr) throw scopeErr

  // Update program scope_version
  await supabase
    .from('programs')
    .update({ scope_version: newVersion })
    .eq('id', program.id)

  // Fire points event (non-blocking)
  if (session.userId) {
    fireEvent(session.userId, 'scope_published', { protocol: params.slug, version: newVersion })
  }

  return NextResponse.json({
    scope: { id: scope.id, version: scope.version },
    message: `Scope updated to version ${newVersion}`,
  }, { status: 201 })
}
