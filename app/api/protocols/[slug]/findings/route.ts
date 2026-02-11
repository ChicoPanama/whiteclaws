import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/protocols/[slug]/findings — list findings (protocol team only)
 * Query params: status, severity, limit, offset
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
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

    // Verify protocol membership (any role can view)
    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', protocol.id)
      .eq('user_id', auth.userId)
      .maybeSingle()
    if (!member) return NextResponse.json({ error: 'Not a protocol member' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('findings')
      .select(`
        id, title, severity, status, scope_version, poc_url,
        payout_amount, payout_currency, paid_at,
        triage_notes, triaged_at, rejected_at, rejection_reason, accepted_at,
        duplicate_of, created_at,
        researcher:researcher_id (handle, display_name, is_agent)
      `)
      .eq('protocol_id', protocol.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (severity) query = query.eq('severity', severity)

    const { data: findings, error } = await query
    if (error) throw error

    return NextResponse.json({ findings: findings || [], count: findings?.length || 0 })
  } catch (error) {
    console.error('Protocol findings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
