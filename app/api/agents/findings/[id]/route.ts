import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/agents/findings/[id] — single finding with comments
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  const supabase = createClient()

  const { data: finding, error } = await supabase
    .from('findings')
    .select(`
      id, title, severity, status, scope_version, created_at,
      triage_notes, triaged_at, accepted_at, rejected_at, rejection_reason,
      payout_amount, payout_currency, payout_tx_hash, paid_at,
      duplicate_of, poc_url,
      protocol:protocol_id (slug, name)
    `)
    .eq('id', params.id!)
    .eq('researcher_id', auth.userId!)
    .maybeSingle()

  if (error) throw error
  if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

  // Get non-internal comments
  const { data: comments } = await supabase
    .from('finding_comments')
    .select('id, content, is_internal, created_at, user:user_id (handle, display_name)')
    .eq('finding_id', params.id!)
    .eq('is_internal', false)
    .order('created_at', { ascending: true })

  return NextResponse.json({ finding, comments: comments || [] })
}
