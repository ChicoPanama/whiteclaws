import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * GET /api/findings/[id]/comment — list comments on a finding
 * POST /api/findings/[id]/comment — add a comment
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  const supabase = createClient()

  // Check the user is either the researcher or a protocol member
  const { data: finding } = await supabase
    .from('findings')
    .select('id, protocol_id, researcher_id')
    .eq('id', params.id)
    .single()

  if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

  const isResearcher = finding.researcher_id === auth.userId
  const { data: member } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('protocol_id', finding.protocol_id)
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!isResearcher && !member) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Researchers don't see internal comments
  let query = supabase
    .from('finding_comments')
    .select('id, content, is_internal, created_at, user:users!user_id(handle, display_name)')
    .eq('finding_id', params.id)
    .order('created_at', { ascending: true })

  if (isResearcher && !member) {
    query = query.eq('is_internal', false)
  }

  const { data: comments, error } = await query
  if (error) throw error

  return NextResponse.json({ comments: comments || [] })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  const body = await req.json()
  if (!body.content || typeof body.content !== 'string' || body.content.length < 1) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  const supabase = createClient()

  const { data: finding } = await supabase
    .from('findings')
    .select('id, protocol_id, researcher_id')
    .eq('id', params.id)
    .single()

  if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

  const isResearcher = finding.researcher_id === auth.userId
  const { data: member } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('protocol_id', finding.protocol_id)
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!isResearcher && !member) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { data: comment, error } = await supabase
    .from('finding_comments')
    .insert({
      finding_id: params.id,
      user_id: auth.userId,
      content: body.content,
      is_internal: body.is_internal && !!member ? true : false,
    })
    .select('id, content, is_internal, created_at')
    .single()

  if (error) throw error

  return NextResponse.json({ comment }, { status: 201 })
}
