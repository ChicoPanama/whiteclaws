import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'
import { emitParticipationEvent, flagSpam } from '@/lib/services/points-engine'
import { requireProtocolAdmin, requireSessionUserId } from '@/lib/auth/protocol-guards'
import { qualifyReferralTree } from '@/lib/services/referral-tree'
import { distributeReferralBonuses } from '@/lib/services/referral-bonuses'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const triageSchema = z.object({
  status: z.enum(['triaged', 'accepted', 'rejected', 'duplicate']),
  notes: z.string().optional(),
  payout_amount: z.number().optional(),
  rejection_reason: z.string().optional(),
  duplicate_of: z.string().uuid().optional(),
})

/**
 * PATCH /api/findings/[id]/triage
 * 
 * Accepts, rejects, or marks duplicate.
 * ACCEPTED → researcher earns major points.
 * REJECTED → researcher loses points (deter false submissions).
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSessionUserId()
    if (!session.ok) return session.res

    const body = await req.json().catch(() => ({}))
    const parsed = triageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.issues }, { status: 400 })
    }

    const supabase = createClient()

    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, status, researcher_id, severity')
      .eq('id', params.id!)
      .returns<Row<'findings'>[]>().single()

    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

    const authz = await requireProtocolAdmin(session.userId, finding.protocol_id!)
    if (!authz.ok) return authz.res

    // Build update
    const updates: Record<string, unknown> = {
      status: parsed.data.status,
      triage_notes: parsed.data.notes || null,
      triaged_by: session.userId,
      triaged_at: new Date().toISOString(),
    }

    // ── Points based on triage outcome ──
    const pointsImpact: Array<{ event: string; points: number }> = []

    if (parsed.data.status === 'accepted') {
      updates.accepted_at = new Date().toISOString()
      if (parsed.data.payout_amount) updates.payout_amount = parsed.data.payout_amount

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

      // ── Multi-Level Referral Bonuses ──
      // Qualify researcher's referral tree (first accepted finding)
      const { data: researcherData } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', finding.researcher_id)
        .single()

      if (researcherData?.wallet_address) {
        // Qualify the referral relationships
        await qualifyReferralTree(researcherData.wallet_address, 'finding_accepted')

        // Distribute bonuses to upline (Tier 1 + Tier 2 points only)
        const tier1Points = acceptResult.points || 0
        const tier2Points = 0 // Findings are Tier 1, no Tier 2 here
        
        const bonusResult = await distributeReferralBonuses(
          researcherData.wallet_address,
          'finding_accepted',
          tier1Points,
          tier2Points,
          1 // current season
        )

        if (bonusResult.success && bonusResult.bonuses_awarded > 0) {
          pointsImpact.push({
            event: 'referral_bonuses_distributed',
            points: bonusResult.total_bonus_points,
          })
        }
      }

    } else if (parsed.data.status === 'rejected') {
      updates.rejected_at = new Date().toISOString()
      updates.rejection_reason = parsed.data.rejection_reason || parsed.data.notes || null

      // PENALTY for rejected finding — deters false submissions
      await flagSpam({
        user_id: finding.researcher_id,
        flag_type: 'rejected_finding',
        finding_id: finding.id,
        metadata: { reason: parsed.data.rejection_reason || 'rejected' },
      })
      pointsImpact.push({ event: 'finding_rejected', points: -25 })

    } else if (parsed.data.status === 'duplicate') {
      if (!parsed.data.duplicate_of) {
        return NextResponse.json({ error: 'duplicate_of required' }, { status: 400 })
      }
      updates.duplicate_of = parsed.data.duplicate_of
      updates.rejected_at = new Date().toISOString()
      updates.rejection_reason = 'Duplicate'

      // Mild penalty for duplicate
      await flagSpam({
        user_id: finding.researcher_id,
        flag_type: 'duplicate_finding',
        finding_id: finding.id,
        metadata: { duplicate_of: parsed.data.duplicate_of },
      })
      pointsImpact.push({ event: 'finding_duplicate', points: -15 })
    }

    const { data: updated, error } = await supabase
      .from('findings')
      .update(updates)
      .eq('id', params.id!)
      .select('id, status, triage_notes, payout_amount, triaged_at, accepted_at, rejected_at')
      .returns<Row<'findings'>[]>().single()

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
