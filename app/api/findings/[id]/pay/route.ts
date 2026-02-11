import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/findings/[id]/pay
 * Record payout for an accepted finding.
 * Body: { tx_hash, amount, currency? }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  const body = await req.json()
  const { tx_hash, amount, currency } = body

  if (!tx_hash || typeof tx_hash !== 'string') {
    return NextResponse.json({ error: 'tx_hash is required' }, { status: 400 })
  }
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
  }

  const supabase = createClient()

  // Get finding
  const { data: finding } = await supabase
    .from('findings')
    .select('id, protocol_id, status, researcher_id')
    .eq('id', params.id)
    .single()

  if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
  if (finding.status !== 'accepted') {
    return NextResponse.json({ error: 'Finding must be accepted before payment' }, { status: 400 })
  }

  // Verify protocol membership
  const { data: member } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('protocol_id', finding.protocol_id)
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owner/admin can record payments' }, { status: 403 })
  }

  // Record payment
  const { data: updated, error } = await supabase
    .from('findings')
    .update({
      status: 'paid',
      payout_tx_hash: tx_hash,
      payout_amount: amount,
      payout_currency: currency || 'USDC',
      paid_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select('id, status, payout_amount, payout_currency, payout_tx_hash, paid_at')
    .single()

  if (error) throw error

  // Update agent reputation + rankings
  if (finding.researcher_id) {
    // Add reputation points (payout / 10)
    const repGain = Math.floor(amount / 10)
    await supabase.rpc('increment_reputation', { user_id: finding.researcher_id, amount: repGain }).catch(() => null)

    // Update agent_rankings
    const { data: ranking } = await supabase
      .from('agent_rankings')
      .select('id, accepted_submissions, total_bounty_amount')
      .eq('agent_id', finding.researcher_id)
      .maybeSingle()

    if (ranking) {
      await supabase
        .from('agent_rankings')
        .update({
          accepted_submissions: (ranking.accepted_submissions || 0) + 1,
          total_bounty_amount: (ranking.total_bounty_amount || 0) + amount,
        })
        .eq('id', ranking.id)
    }
  }

  return NextResponse.json({ finding: updated, message: 'Payment recorded' })
}
