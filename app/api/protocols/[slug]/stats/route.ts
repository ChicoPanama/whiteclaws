import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/protocols/[slug]/stats — public protocol stats
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      .select('id, slug, name, max_bounty')
      .eq('slug', params.slug)
      .maybeSingle()
    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const { data: program } = await supabase
      .from('programs')
      .select('id, status, max_payout, payout_currency, created_at')
      .eq('protocol_id', protocol.id)
      .maybeSingle()

    // Count findings by status
    const { data: findings } = await supabase
      .from('findings')
      .select('status, payout_amount, severity')
      .eq('protocol_id', protocol.id)

    const stats = {
      total_findings: 0,
      submitted: 0,
      triaged: 0,
      accepted: 0,
      rejected: 0,
      paid: 0,
      total_paid_amount: 0,
      by_severity: { critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>,
    }

    for (const f of findings || []) {
      stats.total_findings++
      if (f.status === 'submitted') stats.submitted++
      else if (f.status === 'triaged') stats.triaged++
      else if (f.status === 'accepted') stats.accepted++
      else if (f.status === 'rejected' || f.status === 'duplicate') stats.rejected++
      else if (f.status === 'paid') {
        stats.paid++
        stats.total_paid_amount += f.payout_amount || 0
      }
      if (f.severity && stats.by_severity[f.severity] !== undefined) {
        stats.by_severity[f.severity]++
      }
    }

    return NextResponse.json({
      protocol: { slug: protocol.slug, name: protocol.name, max_bounty: protocol.max_bounty },
      program_status: program?.status || 'none',
      stats,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
