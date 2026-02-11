import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/findings/[id]/triage
 * Body: { status: 'triaged'|'accepted'|'rejected'|'duplicate', notes?, duplicate_of?, payout_amount? }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

    const supabase = createClient()

    // Get finding + protocol
    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, status')
      .eq('id', params.id)
      .maybeSingle()
    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

    // Verify triager access
    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', finding.protocol_id)
      .eq('user_id', auth.userId)
      .maybeSingle()
    if (!member) return NextResponse.json({ error: 'Not a protocol member' }, { status: 403 })

    const body = await req.json()
    const { status, notes, duplicate_of, payout_amount } = body

    if (!['triaged', 'accepted', 'rejected', 'duplicate'].includes(status)) {
      return NextResponse.json({ error: 'status must be triaged, accepted, rejected, or duplicate' }, { status: 400 })
    }

    const updates: any = {
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
      updates.rejection_reason = notes || 'Rejected by protocol team'
    } else if (status === 'duplicate') {
      if (!duplicate_of) {
        return NextResponse.json({ error: 'duplicate_of is required for duplicate status' }, { status: 400 })
      }
      updates.duplicate_of = duplicate_of
      updates.rejected_at = new Date().toISOString()
      updates.rejection_reason = 'Duplicate'
    }

    const { data: updated, error } = await supabase
      .from('findings')
      .update(updates)
      .eq('id', params.id)
      .select('id, status, triage_notes, payout_amount, triaged_at, accepted_at, rejected_at')
      .single()

    if (error) throw error

    return NextResponse.json({ finding: updated })
  } catch (error) {
    console.error('Triage error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
