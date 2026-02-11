import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/protocols/[slug]/findings — list findings (protocol team auth required)
 * Query params: status, severity, limit, offset
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error }, { status: 401 })

  const supabase = createClient()

  const { data: protocol } = await supabase
    .from('protocols')
    .select('id, slug, name')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

  const { data: membership } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('protocol_id', protocol.id)
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Not a member of this protocol' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const severity = searchParams.get('severity')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabase
    .from('findings')
    .select(`
      id, title, severity, status, scope_version, duplicate_of,
      triage_notes, triaged_at, accepted_at, rejected_at, rejection_reason,
      payout_amount, payout_currency, paid_at, poc_url, created_at,
      researcher:researcher_id (id, handle, display_name, is_agent)
    `)
    .eq('protocol_id', protocol.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (severity) query = query.eq('severity', severity)

  const { data: findings, error } = await query
  if (error) throw error

  return NextResponse.json({
    protocol: { slug: protocol.slug, name: protocol.name },
    findings: findings || [],
    count: findings?.length || 0,
    offset,
    limit,
  })
}
