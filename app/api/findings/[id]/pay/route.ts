import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/findings/[id]/pay
 * Body: { tx_hash, amount, currency? }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

    const supabase = createClient()

    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, status, researcher_id')
      .eq('id', params.id)
      .maybeSingle()
    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
    if (finding.status !== 'accepted') {
      return NextResponse.json({ error: 'Finding must be accepted before payment' }, { status: 400 })
    }

    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', finding.protocol_id)
      .eq('user_id', auth.userId)
      .maybeSingle()
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Only protocol owner/admin can record payments' }, { status: 403 })
    }

    const body = await req.json()
    if (!body.tx_hash) {
      return NextResponse.json({ error: 'tx_hash is required' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('findings')
      .update({
        status: 'paid',
        payout_tx_hash: body.tx_hash,
        payout_amount: body.amount || finding.payout_amount,
        payout_currency: body.currency || 'USDC',
        paid_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('id, status, payout_amount, payout_tx_hash, payout_currency, paid_at')
      .single()

    if (error) throw error

    // Update agent reputation + rankings
    if (finding.researcher_id) {
      const amt = updated.payout_amount || 0
      await supabase.rpc('increment_agent_stats', {
        agent_user_id: finding.researcher_id,
        bounty_amount: amt,
      }).catch(() => {
        // RPC may not exist — manual update
        supabase.from('users')
          .update({ reputation_score: supabase.raw(`COALESCE(reputation_score, 0) + ${Math.floor(amt / 100)}`) })
          .eq('id', finding.researcher_id)
      })
    }

    return NextResponse.json({ finding: updated, message: 'Payment recorded' })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
