import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/agents/earnings
 * Total earnings, per-protocol breakdown, pending payouts.
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

    const supabase = createClient()

    // Get all findings with payouts
    const { data: findings } = await supabase
      .from('findings')
      .select('id, status, payout_amount, payout_currency, paid_at, protocols ( slug, name )')
      .eq('researcher_id', auth.userId)
      .in('status', ['accepted', 'paid'])

    const paid = (findings || []).filter((f: any) => f.status === 'paid')
    const pending = (findings || []).filter((f: any) => f.status === 'accepted' && f.payout_amount)

    // Per-protocol breakdown
    const byProtocol: Record<string, { slug: string; name: string; paid: number; pending: number; count: number }> = {}
    for (const f of (findings || []) as any[]) {
      const slug = f.protocols?.slug || 'unknown'
      if (!byProtocol[slug]) {
        byProtocol[slug] = { slug, name: f.protocols?.name || slug, paid: 0, pending: 0, count: 0 }
      }
      byProtocol[slug].count++
      if (f.status === 'paid') byProtocol[slug].paid += f.payout_amount || 0
      else byProtocol[slug].pending += f.payout_amount || 0
    }

    return NextResponse.json({
      total_earned: paid.reduce((s: number, f: any) => s + (f.payout_amount || 0), 0),
      total_pending: pending.reduce((s: number, f: any) => s + (f.payout_amount || 0), 0),
      findings_paid: paid.length,
      findings_pending: pending.length,
      by_protocol: Object.values(byProtocol),
    })
  } catch (error) {
    console.error('Earnings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
