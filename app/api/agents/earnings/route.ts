import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/agents/earnings — total earnings, per-protocol breakdown, pending payouts
 */
export async function GET(req: NextRequest) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error || 'Invalid key' }, { status: 401 })

  const supabase = createClient()

  interface EarningsFinding {
    id: string
    severity: string
    status: string
    payout_amount: number | null
    payout_currency: string | null
    paid_at: string | null
    protocol: { slug: string; name: string } | null
  }

  const { data: findings, error } = await supabase
    .from('findings')
    .select(`
      id, severity, status, payout_amount, payout_currency, paid_at,
      protocol:protocol_id (slug, name)
    `)
    .eq('researcher_id', auth.userId)
    .in('status', ['accepted', 'paid'])
    .returns<EarningsFinding[]>()

  if (error) throw error

  const all = findings || []
  const paid = all.filter(f => f.status === 'paid')
  const pending = all.filter(f => f.status === 'accepted')

  const totalPaid = paid.reduce((sum, f) => sum + (Number(f.payout_amount) || 0), 0)
  const totalPending = pending.reduce((sum, f) => sum + (Number(f.payout_amount) || 0), 0)

  // Per-protocol breakdown
  const byProtocol: Record<string, { slug: string; name: string; paid: number; pending: number; count: number }> = {}
  for (const f of all) {
    const proto = f.protocol
    const slug = proto?.slug || 'unknown'
    if (!byProtocol[slug]) {
      byProtocol[slug] = { slug, name: proto?.name || slug, paid: 0, pending: 0, count: 0 }
    }
    byProtocol[slug].count++
    if (f.status === 'paid') byProtocol[slug].paid += Number(f.payout_amount) || 0
    else byProtocol[slug].pending += Number(f.payout_amount) || 0
  }

  return NextResponse.json({
    earnings: {
      total_paid: totalPaid,
      total_pending: totalPending,
      total: totalPaid + totalPending,
      currency: 'USDC',
      paid_findings: paid.length,
      pending_findings: pending.length,
    },
    by_protocol: Object.values(byProtocol),
  })
}
