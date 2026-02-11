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
    .select('id, slug, name, max_bounty, category, chains')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

  const { data: program } = await supabase
    .from('programs')
    .select('id, status, min_payout, max_payout, payout_currency, response_sla_hours, created_at')
    .eq('protocol_id', protocol.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!program) {
    return NextResponse.json({
      protocol: { slug: protocol.slug, name: protocol.name },
      stats: { total_findings: 0, accepted: 0, total_paid: 0, avg_response_hours: null },
    })
  }

  // Count findings by status
  const { count: totalFindings } = await supabase
    .from('findings')
    .select('id', { count: 'exact', head: true })
    .eq('protocol_id', protocol.id)

  const { count: accepted } = await supabase
    .from('findings')
    .select('id', { count: 'exact', head: true })
    .eq('protocol_id', protocol.id)
    .in('status', ['accepted', 'paid'])

  const { count: paid } = await supabase
    .from('findings')
    .select('id', { count: 'exact', head: true })
    .eq('protocol_id', protocol.id)
    .eq('status', 'paid')

  // Sum payouts
  const { data: payoutData } = await supabase
    .from('findings')
    .select('payout_amount')
    .eq('protocol_id', protocol.id)
    .eq('status', 'paid')
    .not('payout_amount', 'is', null)

  const totalPaid = (payoutData || []).reduce((sum, f) => sum + (Number(f.payout_amount) || 0), 0)

  return NextResponse.json({
    protocol: {
      slug: protocol.slug,
      name: protocol.name,
      category: protocol.category,
      chains: protocol.chains,
      max_bounty: protocol.max_bounty,
    },
    program: {
      status: program.status,
      payout_currency: program.payout_currency,
      min_payout: program.min_payout,
      max_payout: program.max_payout,
      response_sla_hours: program.response_sla_hours,
      live_since: program.created_at,
    },
    stats: {
      total_findings: totalFindings || 0,
      accepted: accepted || 0,
      paid: paid || 0,
      total_paid: totalPaid,
      payout_currency: program.payout_currency,
    },
  })
}
