import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/protocols/[slug]/stats — public program stats
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: protocol } = await supabase
    .from('protocols')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

  // Get program
  const { data: program } = await supabase
    .from('programs')
    .select('id, status, max_payout, min_payout, payout_currency, created_at')
    .eq('protocol_id', protocol.id)
    .neq('status', 'ended')
    .maybeSingle()

  // Count findings by status
  const { data: findings } = await supabase
    .from('findings')
    .select('status, severity, payout_amount, paid_at, created_at, triaged_at')
    .eq('protocol_id', protocol.id)

  const stats = {
    total_findings: 0,
    submitted: 0,
    triaged: 0,
    accepted: 0,
    rejected: 0,
    paid: 0,
    total_paid_amount: 0,
    avg_response_hours: 0,
    by_severity: { critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>,
  }

  if (findings) {
    stats.total_findings = findings.length
    let totalResponseTime = 0
    let responseCounted = 0

    for (const f of findings) {
      if (f.status === 'submitted') stats.submitted++
      else if (f.status === 'triaged') stats.triaged++
      else if (f.status === 'accepted') stats.accepted++
      else if (f.status === 'rejected' || f.status === 'duplicate') stats.rejected++
      else if (f.status === 'paid') {
        stats.paid++
        stats.total_paid_amount += Number(f.payout_amount) || 0
      }

      if (f.severity && stats.by_severity[f.severity] !== undefined) {
        stats.by_severity[f.severity]++
      }

      if (f.triaged_at && f.created_at) {
        const diff = new Date(f.triaged_at).getTime() - new Date(f.created_at).getTime()
        totalResponseTime += diff
        responseCounted++
      }
    }

    if (responseCounted > 0) {
      stats.avg_response_hours = Math.round(totalResponseTime / responseCounted / 3600000)
    }
  }

  return NextResponse.json({
    protocol: { name: protocol.name, slug: protocol.slug },
    program: program ? {
      status: program.status,
      max_payout: program.max_payout,
      payout_currency: program.payout_currency,
      live_since: program.created_at,
    } : null,
    stats,
  })
}
