import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/findings/[id]/comments — list comments on a finding
 * POST /api/findings/[id]/comments — add comment (protocol member or researcher)
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  const supabase = createClient()

  const { data: finding } = await supabase
    .from('findings')
    .select('id, protocol_id, researcher_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

  // Check if user is protocol member or the researcher
  const { data: membership } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('protocol_id', finding.protocol_id)
    .eq('user_id', auth.userId)
    .maybeSingle()

  const isProtocolMember = !!membership
  const isResearcher = finding.researcher_id === auth.userId

  if (!isProtocolMember && !isResearcher) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  let query = supabase
    .from('finding_comments')
    .select('id, content, is_internal, created_at, user:user_id (handle, display_name)')
    .eq('finding_id', params.id)
    .order('created_at', { ascending: true })

  // Researchers can't see internal comments
  if (!isProtocolMember) {
    query = query.eq('is_internal', false)
  }

  const { data: comments, error } = await query
  if (error) throw error

  return NextResponse.json({ comments: comments || [] })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  const supabase = createClient()

  const { data: finding } = await supabase
    .from('findings')
    .select('id, protocol_id, researcher_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

  const { data: membership } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('protocol_id', finding.protocol_id)
    .eq('user_id', auth.userId)
    .maybeSingle()

  const isProtocolMember = !!membership
  const isResearcher = finding.researcher_id === auth.userId

  if (!isProtocolMember && !isResearcher) {
    return NextResponse.json({ error: 'Only protocol team or finding submitter can comment' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.content || typeof body.content !== 'string' || body.content.length < 1) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  // Only protocol members can mark comments as internal
  const isInternal = isProtocolMember ? (body.is_internal || false) : false

  const { data: comment, error } = await supabase
    .from('finding_comments')
    .insert({
      finding_id: params.id,
      user_id: auth.userId,
      content: body.content,
      is_internal: isInternal,
    })
    .select('id, content, is_internal, created_at')
    .single()

  if (error) throw error

  return NextResponse.json({ comment }, { status: 201 })
}
