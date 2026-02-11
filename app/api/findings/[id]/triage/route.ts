import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const auth = await verifyApiKey(apiKey)
    if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error || 'Invalid' }, { status: 401 })
    if (!auth.scopes || !auth.scopes.includes('protocol:triage')) {
      return NextResponse.json({ error: 'Missing protocol:triage scope' }, { status: 403 })
    }

    const body = await req.json()
    const validStatuses = ['triaged', 'accepted', 'rejected', 'duplicate']
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'status must be: ' + validStatuses.join(', ') }, { status: 400 })
    }

    const supabase = createClient()

    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, status')
      .eq('id', params.id)
      .single()

    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', finding.protocol_id)
      .eq('user_id', auth.userId)
      .maybeSingle()

    if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {
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
      updates.rejection_reason = body.rejection_reason || body.notes || null
    } else if (body.status === 'duplicate') {
      if (!body.duplicate_of) {
        return NextResponse.json({ error: 'duplicate_of required' }, { status: 400 })
      }
      updates.duplicate_of = body.duplicate_of
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
