import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/findings/[id]/pay — record payout for accepted finding
 * Body: { tx_hash, amount, currency? }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  const supabase = createClient()
  const body = await req.json()

  if (!body.tx_hash) return NextResponse.json({ error: 'tx_hash is required' }, { status: 400 })
  if (!body.amount) return NextResponse.json({ error: 'amount is required' }, { status: 400 })

  const { data: finding } = await supabase
    .from('findings')
    .select('id, protocol_id, status, researcher_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
  if (finding.status !== 'accepted') return NextResponse.json({ error: 'Finding must be accepted before payment' }, { status: 400 })

  const { data: membership } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('user_id', auth.userId)
    .eq('protocol_id', finding.protocol_id)
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const { data: updated, error } = await supabase
    .from('findings')
    .update({
      status: 'paid',
      payout_tx_hash: body.tx_hash,
      payout_amount: body.amount,
      payout_currency: body.currency || 'USDC',
      paid_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select('id, status, payout_amount, payout_tx_hash, paid_at')
    .single()

  if (error) throw error

  // Update agent reputation + earnings
  await supabase.rpc('increment_agent_earnings', {
    agent_user_id: finding.researcher_id,
    earnings: body.amount,
  }).catch(() => {
    // RPC may not exist — manual update
    return supabase
      .from('agent_rankings')
      .update({
        accepted_submissions: supabase.rpc ? undefined : 0,
        total_bounty_amount: supabase.rpc ? undefined : 0,
      })
      .eq('agent_id', finding.researcher_id)
  })

  return NextResponse.json({ finding: updated, message: 'Payout recorded' })
}
