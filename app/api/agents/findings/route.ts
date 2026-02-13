import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/agents/findings — agent's own findings
 * Filters: ?status=submitted&severity=critical&limit=50
 */
export async function GET(req: NextRequest) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error || 'Invalid' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const severity = searchParams.get('severity')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const supabase = createClient()

  let query = supabase
    .from('findings')
    .select(`
      id, title, severity, status, scope_version, created_at,
      triaged_at, accepted_at, rejected_at, rejection_reason,
      payout_amount, payout_currency, payout_tx_hash, paid_at,
      duplicate_of, poc_url,
      protocol:protocol_id (slug, name)
    `)
    .eq('researcher_id', auth.userId!)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (severity) query = query.eq('severity', severity)

  const { data: findings, error } = await query
  if (error) throw error

  return NextResponse.json({ findings: findings || [], count: findings?.length || 0 })
}
