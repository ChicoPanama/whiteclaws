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
    if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })

    const supabase = createClient()

    const { data: findings } = await supabase
      .from('findings')
      .select('id, status, payout_amount, payout_currency, paid_at, protocol_id')
      .eq('researcher_id', auth.userId)
      .in('status', ['accepted', 'paid'])

    const paid = (findings || []).filter((f: any) => f.status === 'paid')
    const pending = (findings || []).filter((f: any) => f.status === 'accepted' && f.payout_amount)

    return NextResponse.json({
      total_earned: paid.reduce((s: number, f: any) => s + (f.payout_amount || 0), 0),
      total_pending: pending.reduce((s: number, f: any) => s + (f.payout_amount || 0), 0),
      findings_paid: paid.length,
      findings_pending: pending.length,
    })
  } catch (error) {
    console.error('Earnings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
