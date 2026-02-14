import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'
import { fireEvent } from '@/lib/points/hooks'
import { getForwardedIp, requireProtocolAdmin, requireSessionUserId } from '@/lib/auth/protocol-guards'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'
import { hashKey } from '@/lib/rate-limit/keys'

export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()
const paySchema = z.object({
  tx_hash: z.string().min(1).max(256),
  amount: z.number().positive(),
  currency: z.string().min(1).max(16).optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSessionUserId()
    if (!session.ok) return session.res

    const ip = getForwardedIp(req)
    const rl = await checkRateLimit({ key: `finding_pay:${hashKey(ip)}`, limit: 10, windowSeconds: 60 })
    if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const parsedId = idSchema.safeParse(params.id)
    if (!parsedId.success) {
      return NextResponse.json({ error: 'Validation error', details: parsedId.error.issues }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const parsedBody = paySchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Validation error', details: parsedBody.error.issues }, { status: 400 })
    }

    const supabase = createClient()

    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, status, researcher_id')
      .eq('id', parsedId.data)
      .returns<Row<'findings'>[]>().single()

    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
    if (finding.status !== 'accepted') {
      return NextResponse.json({ error: 'Finding must be accepted before payment' }, { status: 400 })
    }

    const authz = await requireProtocolAdmin(session.userId, finding.protocol_id!)
    if (!authz.ok) return authz.res

    const { data: updated, error } = await supabase
      .from('findings')
      .update({
        status: 'paid',
        payout_tx_hash: parsedBody.data.tx_hash,
        payout_amount: parsedBody.data.amount,
        payout_currency: parsedBody.data.currency || 'USDC',
        paid_at: new Date().toISOString(),
      })
      .eq('id', parsedId.data)
      .select('id, status, payout_amount, payout_currency, payout_tx_hash, paid_at')
      .single()

    if (error) throw error

    // Update agent rankings
    if (finding.researcher_id) {
      // Fire points event (non-blocking)
      fireEvent(finding.researcher_id, 'finding_paid', {
        findingId: finding.id,
        amount: parsedBody.data.amount,
        tx_hash: parsedBody.data.tx_hash,
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
            total_bounty_amount: (ranking.total_bounty_amount || 0) + parsedBody.data.amount,
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
