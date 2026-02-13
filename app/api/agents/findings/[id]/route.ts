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

  interface FindingDetail {
    id: string; title: string; severity: string; status: string
    scope_version: number | null; created_at: string
    triage_notes: string | null; triaged_at: string | null
    accepted_at: string | null; rejected_at: string | null; rejection_reason: string | null
    payout_amount: number | null; payout_currency: string | null
    payout_tx_hash: string | null; paid_at: string | null
    duplicate_of: string | null; poc_url: string | null
    protocol: { slug: string; name: string } | null
  }

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
    .returns<FindingDetail[]>()
    .maybeSingle()

  if (error) throw error
  if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

  interface CommentWithUser {
    id: string; content: string; is_internal: boolean; created_at: string
    user: { handle: string; display_name: string | null } | null
  }

  // Get non-internal comments
  const { data: comments } = await supabase
    .from('finding_comments')
    .select('id, content, is_internal, created_at, user:user_id (handle, display_name)')
    .eq('finding_id', params.id!)
    .eq('is_internal', false)
    .order('created_at', { ascending: true })
    .returns<CommentWithUser[]>()

  return NextResponse.json({ finding, comments: comments || [] })
}
