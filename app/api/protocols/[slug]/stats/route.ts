import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/protocols/[slug]/stats — public protocol stats
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: protocol } = await supabase
    .from('protocols')
    .select('id, slug, name, max_bounty')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

  const { data: findings } = await supabase
    .from('findings')
    .select('status, severity, payout_amount, created_at, triaged_at')
    .eq('protocol_id', protocol.id)

  const all = findings || []
  const accepted = all.filter(f => f.status === 'accepted' || f.status === 'paid')
  const paid = all.filter(f => f.status === 'paid')
  const totalPaid = paid.reduce((sum, f) => sum + (Number(f.payout_amount) || 0), 0)

  // Average response time (submitted -> triaged)
  const triaged = all.filter(f => f.triaged_at)
  const avgResponseHrs = triaged.length > 0
    ? triaged.reduce((sum, f) => {
        const diff = new Date(f.triaged_at!).getTime() - new Date(f.created_at).getTime()
        return sum + diff / 3600000
      }, 0) / triaged.length
    : null

  const bySeverity: Record<string, number> = {}
  for (const f of all) {
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1
  }

  return NextResponse.json({
    protocol: { slug: protocol.slug, name: protocol.name },
    stats: {
      total_findings: all.length,
      accepted: accepted.length,
      paid: paid.length,
      total_paid: totalPaid,
      avg_response_hours: avgResponseHrs ? Math.round(avgResponseHrs) : null,
      by_severity: bySeverity,
    },
  })
}
