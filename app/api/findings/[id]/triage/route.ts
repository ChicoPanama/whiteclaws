import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/findings/[id]/triage
 * Protocol triager: accept, reject, or mark as duplicate.
 * Body: { status: 'triaged'|'accepted'|'rejected'|'duplicate', notes?, duplicate_of?, payout_amount? }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })
    if (!auth.scopes?.includes('protocol:triage')) return NextResponse.json({ error: 'Missing triage scope' }, { status: 403 })

    const supabase = createClient()
    const body = await req.json()

    const validStatuses = ['triaged', 'accepted', 'rejected', 'duplicate']
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    // Verify finding exists and user has access to its protocol
    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, status')
      .eq('id', params.id)
      .maybeSingle()

    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

    // Verify membership
    const { data: membership } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', finding.protocol_id)
      .eq('user_id', auth.userId)
      .maybeSingle()

    if (!membership) return NextResponse.json({ error: 'Not authorized for this protocol' }, { status: 403 })

    const updates: Record<string, any> = {
      status: body.status,
      triage_notes: body.notes || null,
      triaged_by: auth.userId,
      triaged_at: new Date().toISOString(),
    }

    if (body.status === 'accepted') {
      updates.accepted_at = new Date().toISOString()
      if (body.payout_amount) updates.payout_amount = body.payout_amount
    } else if (body.status === 'rejected') {
      updates.rejected_at = new Date().toISOString()
      updates.rejection_reason = body.reason || body.notes || null
    } else if (body.status === 'duplicate') {
      if (body.duplicate_of) updates.duplicate_of = body.duplicate_of
    }

    const { data, error } = await supabase
      .from('findings')
      .update(updates)
      .eq('id', params.id)
      .select('id, title, severity, status, payout_amount, triaged_at')
      .single()

    if (error) throw error

    return NextResponse.json({ finding: data })
  } catch (error) {
    console.error('Triage error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
