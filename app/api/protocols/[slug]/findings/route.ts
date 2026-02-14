import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { requireProtocolMember, requireSessionUserId } from '@/lib/auth/protocol-guards'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await requireSessionUserId()
    if (!session.ok) return session.res

    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      .select('id, slug, name')
      .eq('slug', params.slug)
      .single()

    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const membership = await requireProtocolMember(session.userId, protocol.id)
    if (!membership.ok) return membership.res

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

	    let query = supabase
	      .from('findings')
	      .select(`
	        id, title, severity, status, scope_version, poc_url,
	        payout_amount, payout_currency, payout_tx_hash, paid_at, duplicate_of,
	        triage_notes, triaged_at, accepted_at, rejected_at, rejection_reason,
	        encrypted_report,
	        created_at, updated_at,
	        researcher:researcher_id (id, handle, display_name)
	      `)
	      .eq('protocol_id', protocol.id)
	      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (severity) query = query.eq('severity', severity)

    const { data: findings, error } = await query
    if (error) throw error

    // Get total count for pagination
    let countQuery = supabase
      .from('findings')
      .select('id', { count: 'exact', head: true })
      .eq('protocol_id', protocol.id)
    if (status) countQuery = countQuery.eq('status', status)
    if (severity) countQuery = countQuery.eq('severity', severity)
    const { count: totalCount } = await countQuery

    return NextResponse.json({
      protocol: { slug: protocol.slug, name: protocol.name },
      findings: findings || [],
      count: (findings || []).length,
      total: totalCount || 0,
      offset,
      limit,
    })
  } catch (error) {
    console.error('Findings list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
