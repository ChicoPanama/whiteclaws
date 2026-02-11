import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/protocols/[slug]/stats — public stats for a protocol's bounty program
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
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
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Count findings by status
  const { count: totalFindings } = await supabase
    .from('findings')
    .select('id', { count: 'exact', head: true })
    .eq('protocol_id', protocol.id)

  const { count: acceptedFindings } = await supabase
    .from('findings')
    .select('id', { count: 'exact', head: true })
    .eq('protocol_id', protocol.id)
    .in('status', ['accepted', 'paid'])

  const { count: paidFindings } = await supabase
    .from('findings')
    .select('id', { count: 'exact', head: true })
    .eq('protocol_id', protocol.id)
    .eq('status', 'paid')

  // Sum total paid
  const { data: payoutData } = await supabase
    .from('findings')
    .select('payout_amount')
    .eq('protocol_id', protocol.id)
    .eq('status', 'paid')

  const totalPaid = (payoutData || []).reduce((sum, f) => sum + (f.payout_amount || 0), 0)

  // Calculate avg response time (submitted → triaged, in hours)
  const { data: triagedFindings } = await supabase
    .from('findings')
    .select('created_at, triaged_at')
    .eq('protocol_id', protocol.id)
    .not('triaged_at', 'is', null)

  let avgResponseHours: number | null = null
  if (triagedFindings && triagedFindings.length > 0) {
    const totalHours = triagedFindings.reduce((sum, f) => {
      const submitted = new Date(f.created_at).getTime()
      const triaged = new Date(f.triaged_at).getTime()
      return sum + (triaged - submitted) / 3600000
    }, 0)
    avgResponseHours = Math.round((totalHours / triagedFindings.length) * 10) / 10
  }

  return NextResponse.json({
    protocol: { slug: protocol.slug, name: protocol.name },
    program_status: program?.status || 'none',
    stats: {
      total_findings: totalFindings || 0,
      accepted_findings: acceptedFindings || 0,
      paid_findings: paidFindings || 0,
      total_paid: totalPaid,
      payout_currency: program?.payout_currency || 'USDC',
      max_bounty: program?.max_payout || protocol.max_bounty || 0,
      avg_response_hours: avgResponseHours,
      program_live_since: program?.created_at || null,
    },
  })
}
