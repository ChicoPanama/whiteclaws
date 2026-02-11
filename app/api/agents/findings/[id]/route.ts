import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/agents/findings/[id]
 * Single finding detail including triage notes and comments.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })

    const supabase = createClient()

    const { data: finding, error } = await supabase
      .from('findings')
      .select(`
        *, protocols ( slug, name )
      `)
      .eq('id', params.id)
      .eq('researcher_id', auth.userId)
      .maybeSingle()

    if (error) throw error
    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

    // Get comments (non-internal only for agents)
    const { data: comments } = await supabase
      .from('finding_comments')
      .select('id, content, created_at, user_id')
      .eq('finding_id', params.id)
      .eq('is_internal', false)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      finding: {
        id: finding.id,
        title: finding.title,
        severity: finding.severity,
        status: finding.status,
        description: finding.description,
        protocol: finding.protocols?.slug,
        protocol_name: finding.protocols?.name,
        scope_version: finding.scope_version,
        triage_notes: finding.triage_notes,
        rejection_reason: finding.rejection_reason,
        payout_amount: finding.payout_amount,
        payout_currency: finding.payout_currency,
        payout_tx_hash: finding.payout_tx_hash,
        created_at: finding.created_at,
        triaged_at: finding.triaged_at,
        accepted_at: finding.accepted_at,
        rejected_at: finding.rejected_at,
        paid_at: finding.paid_at,
      },
      comments: comments || [],
    })
  } catch (error) {
    console.error('Finding detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
