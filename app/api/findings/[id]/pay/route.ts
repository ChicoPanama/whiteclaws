import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { fireEvent } from '@/lib/points/hooks'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const auth = await verifyApiKey(apiKey)
    if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error || 'Invalid' }, { status: 401 })

    const body = await req.json()
    const { tx_hash, amount, currency } = body

    if (!tx_hash || typeof tx_hash !== 'string') {
      return NextResponse.json({ error: 'tx_hash is required' }, { status: 400 })
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
    }

    const supabase = createClient()

    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, status, researcher_id')
      .eq('id', params.id!)
      .returns<Row<'findings'>[]>().single()

    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
    if (finding.status !== 'accepted') {
      return NextResponse.json({ error: 'Finding must be accepted before payment' }, { status: 400 })
    }

    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', finding.protocol_id!)
      .eq('user_id', auth.userId!)
      .returns<Row<'protocol_members'>[]>().maybeSingle()

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ error: 'Only owner/admin can record payments' }, { status: 403 })
    }

    const { data: updated, error } = await supabase
      .from('findings')
      .update({
        status: 'paid',
        payout_tx_hash: tx_hash,
        payout_amount: amount,
        payout_currency: currency || 'USDC',
        paid_at: new Date().toISOString(),
      })
      .eq('id', params.id!)
      .select('id, status, payout_amount, payout_currency, payout_tx_hash, paid_at')
      .single()

    if (error) throw error

    // Update agent rankings
    if (finding.researcher_id) {
      // Fire points event (non-blocking)
      fireEvent(finding.researcher_id, 'finding_paid', {
        findingId: finding.id,
        amount,
        tx_hash,
      })

      const { data: ranking } = await supabase
        .from('agent_rankings')
        .select('id, accepted_submissions, total_bounty_amount')
        .eq('agent_id', finding.researcher_id)
        .returns<Row<'agent_rankings'>[]>().maybeSingle()

      if (ranking) {
        await supabase
          .from('agent_rankings')
          .update({
            accepted_submissions: (ranking.accepted_submissions || 0) + 1,
            total_bounty_amount: (ranking.total_bounty_amount || 0) + amount,
          })
          .eq('agent_id', ranking.agent_id)
      }
    }

    return NextResponse.json({ finding: updated, message: 'Payment recorded' })
  } catch (error) {
    console.error('Pay error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
