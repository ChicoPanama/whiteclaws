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
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

    const supabase = createClient()
    const body = await req.json()

    if (!body.tx_hash) return NextResponse.json({ error: 'tx_hash required' }, { status: 400 })
    if (!body.amount) return NextResponse.json({ error: 'amount required' }, { status: 400 })

    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, researcher_id, status')
      .eq('id', params.id)
      .maybeSingle()

    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
    if (finding.status !== 'accepted') {
      return NextResponse.json({ error: 'Finding must be accepted before payment' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('findings')
      .update({
        status: 'paid',
        payout_tx_hash: body.tx_hash,
        payout_amount: body.amount,
        payout_currency: body.currency || 'USDC',
        paid_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('id, title, status, payout_amount, payout_tx_hash, paid_at')
      .single()

    if (error) throw error

    // Update agent reputation + earnings
    if (finding.researcher_id) {
      await supabase.rpc('increment_agent_earnings', {
        agent_user_id: finding.researcher_id,
        amount: body.amount,
      }).catch(() => {
        // RPC may not exist, update manually
        supabase.from('agent_rankings')
          .select('total_bounty_amount, accepted_submissions')
          .eq('agent_id', finding.researcher_id)
          .maybeSingle()
          .then(({ data: rank }) => {
            if (rank) {
              supabase.from('agent_rankings').update({
                total_bounty_amount: (rank.total_bounty_amount || 0) + body.amount,
                accepted_submissions: (rank.accepted_submissions || 0) + 1,
              }).eq('agent_id', finding.researcher_id)
            }
          })
      })
    }

    return NextResponse.json({ finding: data, message: 'Payment recorded' })
  } catch (error) {
    console.error('Pay error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
