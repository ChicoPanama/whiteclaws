import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols').select('id, slug, name').eq('slug', params.slug).maybeSingle()
    if (!protocol) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { count: totalFindings } = await supabase
      .from('findings').select('id', { count: 'exact', head: true }).eq('protocol_id', protocol.id)

    const { count: accepted } = await supabase
      .from('findings').select('id', { count: 'exact', head: true })
      .eq('protocol_id', protocol.id).eq('status', 'accepted')

    const { count: paid } = await supabase
      .from('findings').select('id', { count: 'exact', head: true })
      .eq('protocol_id', protocol.id).eq('status', 'paid')

    const { data: paidFindings } = await supabase
      .from('findings').select('payout_amount')
      .eq('protocol_id', protocol.id).eq('status', 'paid')

    const totalPaid = (paidFindings || []).reduce((s: number, f: any) => s + (f.payout_amount || 0), 0)

    return NextResponse.json({
      protocol: { slug: protocol.slug, name: protocol.name },
      total_findings: totalFindings || 0,
      accepted: accepted || 0,
      paid: paid || 0,
      total_paid: totalPaid,
    })
  } catch (error) {
    console.error('Protocol stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
