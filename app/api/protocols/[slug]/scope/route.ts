import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/protocols/[slug]/scope — publish new scope version
 * GET /api/protocols/[slug]/scope — get current scope (public)
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
    .select('id, scope_version')
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
    protocol: protocol.slug,
    program_id: program.id,
    scope_version: program.scope_version,
    scope: scope || { version: 0, contracts: [], in_scope: [], out_of_scope: [], severity_definitions: {} },
  })
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      .select('id')
      .eq('slug', params.slug)
      .maybeSingle()
    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', protocol.id)
      .eq('user_id', auth.userId)
      .maybeSingle()
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Not a protocol admin' }, { status: 403 })
    }

    const { data: program } = await supabase
      .from('programs')
      .select('id, scope_version')
      .eq('protocol_id', protocol.id)
      .maybeSingle()
    if (!program) return NextResponse.json({ error: 'No program found' }, { status: 404 })

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
        severity_definitions: body.severity_definitions || {},
      })
      .select('*')
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
