import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { emitParticipationEvent, flagSpam } from '@/lib/services/points-engine'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/findings/[id]/triage
 * 
 * Accepts, rejects, or marks duplicate.
 * ACCEPTED → researcher earns major points.
 * REJECTED → researcher loses points (deter false submissions).
 */
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
      .select('id, protocol_id, status, researcher_id, severity')
      .eq('id', params.id)
      .single()

    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

    // Verify caller is protocol member
    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', finding.protocol_id)
      .eq('user_id', auth.userId)
      .maybeSingle()

    if (!member) return NextResponse.json({ error: 'Not a member of this protocol' }, { status: 403 })

    // Build update
    const updates: Record<string, unknown> = {
      status: body.status,
      triage_notes: body.notes || null,
      triaged_by: auth.userId,
      triaged_at: new Date().toISOString(),
    }

    // ── Points based on triage outcome ──
    const pointsImpact: Array<{ event: string; points: number }> = []

    if (body.status === 'accepted') {
      updates.accepted_at = new Date().toISOString()
      if (body.payout_amount) updates.payout_amount = body.payout_amount

      // MAJOR points for accepted finding
      const acceptResult = await emitParticipationEvent({
        user_id: finding.researcher_id,
        event_type: 'finding_accepted',
        metadata: { finding_id: finding.id, protocol_id: finding.protocol_id },
        finding_id: finding.id,
      })
      if (acceptResult.success) pointsImpact.push({ event: 'finding_accepted', points: acceptResult.points })

      // Critical severity bonus
      if (finding.severity === 'critical') {
        const critResult = await emitParticipationEvent({
          user_id: finding.researcher_id,
          event_type: 'critical_finding',
          metadata: { finding_id: finding.id },
          finding_id: finding.id,
        })
        if (critResult.success) pointsImpact.push({ event: 'critical_finding', points: critResult.points })
      }

    } else if (body.status === 'rejected') {
      updates.rejected_at = new Date().toISOString()
      updates.rejection_reason = body.rejection_reason || body.notes || null

      // PENALTY for rejected finding — deters false submissions
      await flagSpam({
        user_id: finding.researcher_id,
        flag_type: 'rejected_finding',
        finding_id: finding.id,
        metadata: { reason: body.rejection_reason || 'rejected' },
      })
      pointsImpact.push({ event: 'finding_rejected', points: -25 })

    } else if (body.status === 'duplicate') {
      if (!body.duplicate_of) {
        return NextResponse.json({ error: 'duplicate_of required' }, { status: 400 })
      }
      updates.duplicate_of = body.duplicate_of
      updates.rejected_at = new Date().toISOString()
      updates.rejection_reason = 'Duplicate'

      // Mild penalty for duplicate
      await flagSpam({
        user_id: finding.researcher_id,
        flag_type: 'duplicate_finding',
        finding_id: finding.id,
        metadata: { duplicate_of: body.duplicate_of },
      })
      pointsImpact.push({ event: 'finding_duplicate', points: -15 })
    }

    const { data: updated, error } = await supabase
      .from('findings')
      .update(updates)
      .eq('id', params.id)
      .select('id, status, triage_notes, payout_amount, triaged_at, accepted_at, rejected_at')
      .single()

    if (error) throw error

    return NextResponse.json({
      finding: updated,
      points_impact: pointsImpact,
    })
  } catch (error) {
    console.error('Triage error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
