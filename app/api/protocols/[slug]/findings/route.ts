import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/protocols/[slug]/findings — list findings for this protocol (auth required)
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  const supabase = createClient()

  const { data: membership } = await supabase
    .from('protocol_members')
    .select('protocol_id, protocols!inner(slug)')
    .eq('user_id', auth.userId)
    .eq('protocols.slug', params.slug)
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Not a member of this protocol' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const severity = searchParams.get('severity')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  let query = supabase
    .from('findings')
    .select(`
      id, title, severity, status, scope_version, created_at, triaged_at, accepted_at, rejected_at, paid_at,
      payout_amount, payout_currency, duplicate_of,
      researcher:researcher_id (handle, display_name, is_agent)
    `)
    .eq('protocol_id', membership.protocol_id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (severity) query = query.eq('severity', severity)

  const { data: findings, error } = await query
  if (error) throw error

  return NextResponse.json({ findings: findings || [], count: findings?.length || 0 })
}
