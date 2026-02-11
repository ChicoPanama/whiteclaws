import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  try {
    const body = await req.json()
    const { content, is_internal } = body

    if (!content || typeof content !== 'string' || content.length < 1) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const supabase = createClient()

    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, researcher_id')
      .eq('id', params.id)
      .maybeSingle()

    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

    const isResearcher = finding.researcher_id === auth.userId
    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', finding.protocol_id)
      .eq('user_id', auth.userId)
      .maybeSingle()

    if (!isResearcher && !member) {
      return NextResponse.json({ error: 'Not authorized to comment on this finding' }, { status: 403 })
    }

    const internal = is_internal === true && !!member

    const { data: comment, error } = await supabase
      .from('finding_comments')
      .insert({
        finding_id: params.id,
        user_id: auth.userId,
        content,
        is_internal: internal,
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
  const apiKey = extractApiKey(req)
  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const auth = await verifyApiKey(apiKey)
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

  const supabase = createClient()

  const { data: finding } = await supabase
    .from('findings')
    .select('id, protocol_id, researcher_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

  const isResearcher = finding.researcher_id === auth.userId
  const { data: member } = await supabase
    .from('protocol_members')
    .select('role')
    .eq('protocol_id', finding.protocol_id)
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!isResearcher && !member) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  let query = supabase
    .from('finding_comments')
    .select('id, content, is_internal, created_at, user_id')
    .eq('finding_id', params.id)
    .order('created_at', { ascending: true })

  if (!member) {
    query = query.eq('is_internal', false)
  }

  const { data: comments, error } = await query
  if (error) {
    console.error('Comments query error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ comments: comments || [] })
}
