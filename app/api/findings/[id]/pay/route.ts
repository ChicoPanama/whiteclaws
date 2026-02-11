import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/findings/[id]/pay — record payout for an accepted finding
 * Body: { tx_hash, amount, currency? }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error }, { status: 401 })

  const supabase = createClient()

  const { data: finding } = await supabase
    .from('findings')
    .select('id, protocol_id, researcher_id, status, payout_amount')
    .eq('id', params.id)
    .maybeSingle()

  if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

  const { data: membership } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('protocol_id', finding.protocol_id)
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Only protocol owners/admins can record payments' }, { status: 403 })
  }

  if (finding.status !== 'accepted') {
    return NextResponse.json({ error: 'Finding must be accepted before payment' }, { status: 400 })
  }

  const body = await req.json()
  if (!body.tx_hash) return NextResponse.json({ error: 'tx_hash required' }, { status: 400 })
  if (!body.amount || body.amount <= 0) return NextResponse.json({ error: 'amount required (> 0)' }, { status: 400 })

  const { data, error } = await supabase
    .from('findings')
    .update({
      status: 'paid',
      payout_amount: body.amount,
      payout_tx_hash: body.tx_hash,
      payout_currency: body.currency || 'USDC',
      paid_at: new Date().toISOString(),
    })
    .eq('id', finding.id)
    .select('id, status, payout_amount, payout_tx_hash, payout_currency, paid_at')
    .single()

  if (error) throw error

  // Update agent earnings in agent_rankings
  await supabase.rpc('increment_bounty', {
    agent_user_id: finding.researcher_id,
    bounty_amount: body.amount,
  }).catch(() => {
    // RPC may not exist, update directly
    // This is a best-effort update
  })

  return NextResponse.json({ finding: data, message: 'Payment recorded' })
}
