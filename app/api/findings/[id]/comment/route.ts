import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/findings/[id]/comment — add a comment
 * GET /api/findings/[id]/comment — list comments
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

    const body = await req.json()
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Verify finding exists
    const { data: finding } = await supabase
      .from('findings').select('id, researcher_id, protocol_id').eq('id', params.id).maybeSingle()
    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

    // Verify user is either the researcher or a protocol member
    const isResearcher = finding.researcher_id === auth.userId
    const { data: membership } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', finding.protocol_id)
      .eq('user_id', auth.userId)
      .maybeSingle()

    if (!isResearcher && !membership) {
      return NextResponse.json({ error: 'Not authorized to comment on this finding' }, { status: 403 })
    }

    const { data: comment, error } = await supabase
      .from('finding_comments')
      .insert({
        finding_id: params.id,
        user_id: auth.userId,
        content: body.content,
        is_internal: body.is_internal ?? false,
      })
      .select('id, content, is_internal, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Comment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

    const supabase = createClient()

    const { data: comments, error } = await supabase
      .from('finding_comments')
      .select('id, content, is_internal, created_at, user_id')
      .eq('finding_id', params.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ comments: comments || [] })
  } catch (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
