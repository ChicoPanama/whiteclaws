import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/protocols/[slug]/scope
 * Publish a new scope version. Auto-increments version number.
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })
    if (!auth.scopes?.includes('protocol:write')) return NextResponse.json({ error: 'Missing scope' }, { status: 403 })

    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols').select('id').eq('slug', params.slug).maybeSingle()
    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const { data: program } = await supabase
      .from('programs').select('id, scope_version').eq('protocol_id', protocol.id).maybeSingle()
    if (!program) return NextResponse.json({ error: 'No program exists' }, { status: 404 })

    const body = await req.json()
    const newVersion = program.scope_version + 1

    const { data: scope, error } = await supabase
      .from('program_scopes')
      .insert({
        program_id: program.id,
        version: newVersion,
        contracts: body.contracts || [],
        in_scope: body.in_scope || [],
        out_of_scope: body.out_of_scope || [],
        severity_definitions: body.severity_definitions || undefined,
      })
      .select('id, version')
      .single()

    if (error) throw error

    // Update program scope_version
    await supabase.from('programs').update({ scope_version: newVersion }).eq('id', program.id)

    return NextResponse.json({
      scope: { id: scope.id, version: scope.version },
      message: `Scope v${newVersion} published. Agents will use this version for new submissions.`,
    }, { status: 201 })
  } catch (error) {
    console.error('Scope publish error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/protocols/[slug]/scope
 * Public: get current scope (agents call this before scanning).
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols').select('id, slug, name').eq('slug', params.slug).maybeSingle()
    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const { data: program } = await supabase
      .from('programs').select('id, scope_version, status, poc_required, exclusions')
      .eq('protocol_id', protocol.id).maybeSingle()
    if (!program) return NextResponse.json({ error: 'No bounty program' }, { status: 404 })

    const { data: scope } = await supabase
      .from('program_scopes').select('*')
      .eq('program_id', program.id).eq('version', program.scope_version).maybeSingle()

    return NextResponse.json({
      protocol: { slug: protocol.slug, name: protocol.name },
      scope_version: program.scope_version,
      status: program.status,
      poc_required: program.poc_required,
      exclusions: program.exclusions,
      contracts: scope?.contracts || [],
      in_scope: scope?.in_scope || [],
      out_of_scope: scope?.out_of_scope || [],
      severity_definitions: scope?.severity_definitions || {},
    })
  } catch (error) {
    console.error('Scope fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
