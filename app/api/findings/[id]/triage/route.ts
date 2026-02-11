import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

async function getProtocolAccessForFinding(req: NextRequest, findingId: string) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return { error: 'Missing API key', status: 401 }

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return { error: auth.error, status: 401 }

  const supabase = createClient()

  const { data: finding } = await supabase
    .from('findings')
    .select('id, protocol_id, researcher_id, status')
    .eq('id', findingId)
    .maybeSingle()

  if (!finding) return { error: 'Finding not found', status: 404 }

  const { data: membership } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('protocol_id', finding.protocol_id)
    .eq('user_id', auth.userId)
    .maybeSingle()

  // Allow if protocol member OR the researcher who submitted
  const isProtocolMember = !!membership
  const isResearcher = finding.researcher_id === auth.userId

  return { auth, finding, membership, isProtocolMember, isResearcher, supabase }
}

/**
 * PATCH /api/findings/[id]/triage — triage a finding (protocol team only)
 * Body: { status: 'triaged'|'accepted'|'rejected'|'duplicate', notes?, duplicate_of?, payout_amount? }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await getProtocolAccessForFinding(req, params.id)
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })

  if (!access.isProtocolMember) {
    return NextResponse.json({ error: 'Only protocol team can triage findings' }, { status: 403 })
  }

  const { supabase, finding, auth } = access
  const body = await req.json()

  const validStatuses = ['triaged', 'accepted', 'rejected', 'duplicate']
  if (!body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
  }

  const updates: Record<string, any> = {
    status: body.status,
    triage_notes: body.notes || null,
    triaged_by: auth.userId,
    triaged_at: new Date().toISOString(),
  }

  if (body.status === 'accepted') {
    updates.accepted_at = new Date().toISOString()
    if (body.payout_amount) updates.payout_amount = body.payout_amount
  }
  if (body.status === 'rejected') {
    updates.rejected_at = new Date().toISOString()
    updates.rejection_reason = body.reason || null
  }
  if (body.status === 'duplicate') {
    if (!body.duplicate_of) {
      return NextResponse.json({ error: 'duplicate_of finding ID required' }, { status: 400 })
    }
    updates.duplicate_of = body.duplicate_of
    updates.rejected_at = new Date().toISOString()
    updates.rejection_reason = 'Duplicate'
  }

  const { data, error } = await supabase
    .from('findings')
    .update(updates)
    .eq('id', finding.id)
    .select('id, status, triage_notes, payout_amount, triaged_at, accepted_at, rejected_at')
    .single()

  if (error) throw error

  return NextResponse.json({ finding: data, message: `Finding ${body.status}` })
}
