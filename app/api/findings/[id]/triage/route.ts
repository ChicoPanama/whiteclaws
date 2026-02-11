import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/findings/[id]/triage
 * Triage a finding: accept, reject, or mark as duplicate
 * Auth: protocol member with triage scope
 * Body: { status: 'triaged'|'accepted'|'rejected'|'duplicate',
 *         notes?, rejection_reason?, duplicate_of?, payout_amount? }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })
  if (!auth.scopes?.includes('protocol:triage')) {
    return NextResponse.json({ error: 'Missing protocol:triage scope' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { status, notes, rejection_reason, duplicate_of, payout_amount } = body

    const validStatuses = ['triaged', 'accepted', 'rejected', 'duplicate']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const supabase = createClient()

    // Get finding + verify protocol membership
    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, status')
      .eq('id', params.id)
      .maybeSingle()

    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', finding.protocol_id)
      .eq('user_id', auth.userId)
      .maybeSingle()

    if (!member) return NextResponse.json({ error: 'Not authorized for this protocol' }, { status: 403 })

    // Build update
    const updates: Record<string, any> = {
      status,
      triage_notes: notes || null,
      triaged_by: auth.userId,
      triaged_at: new Date().toISOString(),
    }

    if (status === 'accepted') {
      updates.accepted_at = new Date().toISOString()
      if (payout_amount) updates.payout_amount = payout_amount
    } else if (status === 'rejected') {
      updates.rejected_at = new Date().toISOString()
      updates.rejection_reason = rejection_reason || null
    } else if (status === 'duplicate') {
      updates.rejected_at = new Date().toISOString()
      updates.rejection_reason = 'Duplicate'
      if (duplicate_of) updates.duplicate_of = duplicate_of
    }

    const { data: updated, error } = await supabase
      .from('findings')
      .update(updates)
      .eq('id', params.id)
      .select('id, title, severity, status, triage_notes, payout_amount, triaged_at')
      .single()

    if (error) throw error

    return NextResponse.json({ finding: updated })
  } catch (error) {
    console.error('Triage error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
