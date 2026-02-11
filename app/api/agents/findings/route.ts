import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/agents/findings
 * Agent's own findings with status filter.
 * ?status=submitted|triaged|accepted|rejected|paid&limit=50
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const supabase = createClient()

    let query = supabase
      .from('findings')
      .select(`
        id, title, severity, status, scope_version, payout_amount, payout_currency,
        created_at, triaged_at, accepted_at, rejected_at, paid_at, rejection_reason,
        protocols!inner ( slug, name )
      `)
      .eq('researcher_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status)

    const { data: findings, error } = await query

    if (error) throw error

    return NextResponse.json({
      findings: (findings || []).map((f: any) => ({
        id: f.id,
        title: f.title,
        severity: f.severity,
        status: f.status,
        protocol: f.protocols?.slug,
        protocol_name: f.protocols?.name,
        scope_version: f.scope_version,
        payout_amount: f.payout_amount,
        payout_currency: f.payout_currency,
        created_at: f.created_at,
        triaged_at: f.triaged_at,
        accepted_at: f.accepted_at,
        rejected_at: f.rejected_at,
        rejection_reason: f.rejection_reason,
        paid_at: f.paid_at,
      })),
      count: findings?.length || 0,
    })
  } catch (error) {
    console.error('Agent findings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
