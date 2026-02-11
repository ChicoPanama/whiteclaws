import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/findings/[id]/triage — triage a finding (accept/reject/duplicate)
 * Body: { status: 'triaged'|'accepted'|'rejected'|'duplicate', notes?, duplicate_of?, payout_amount? }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })
  if (!auth.scopes?.includes('protocol:triage')) return NextResponse.json({ error: 'Missing protocol:triage scope' }, { status: 403 })

  const supabase = createClient()
  const body = await req.json()
  const { status, notes, duplicate_of, payout_amount } = body

  const validStatuses = ['triaged', 'accepted', 'rejected', 'duplicate']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
  }

  // Verify finding exists and user has access to its protocol
  const { data: finding } = await supabase
    .from('findings')
    .select('id, protocol_id, status')
    .eq('id', params.id)
    .maybeSingle()

  if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

  const { data: membership } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('user_id', auth.userId)
    .eq('protocol_id', finding.protocol_id)
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Not authorized for this protocol' }, { status: 403 })

  const now = new Date().toISOString()
  const updates: Record<string, any> = {
    status,
    triage_notes: notes || null,
    triaged_by: auth.userId,
    triaged_at: now,
  }

  if (status === 'accepted') {
    updates.accepted_at = now
    if (payout_amount) updates.payout_amount = payout_amount
  } else if (status === 'rejected') {
    updates.rejected_at = now
    updates.rejection_reason = notes || null
  } else if (status === 'duplicate') {
    updates.duplicate_of = duplicate_of || null
    updates.rejected_at = now
    updates.rejection_reason = 'Duplicate finding'
  }

  const { data: updated, error } = await supabase
    .from('findings')
    .update(updates)
    .eq('id', params.id)
    .select('id, status, payout_amount, triaged_at')
    .single()

  if (error) throw error

  return NextResponse.json({ finding: updated, message: `Finding ${status}` })
}
