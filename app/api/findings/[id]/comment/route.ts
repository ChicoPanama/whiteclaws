import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const auth = await verifyApiKey(apiKey)
    if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error || 'Invalid' }, { status: 401 })

    const supabase = createClient()

    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, researcher_id')
      .eq('id', params.id!)
      .returns<Row<'findings'>[]>().single()

    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

    const isResearcher = finding.researcher_id === auth.userId
    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', finding.protocol_id!)
      .eq('user_id', auth.userId!)
      .returns<Row<'protocol_members'>[]>().maybeSingle()

    if (!isResearcher && !member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    interface CommentWithUser {
      id: string; content: string; is_internal: boolean; created_at: string
      user: { id: string; handle: string; display_name: string | null } | null
    }

    let query = supabase
      .from('finding_comments')
      .select('id, content, is_internal, created_at, user:user_id (id, handle, display_name)')
      .eq('finding_id', params.id!)
      .order('created_at', { ascending: true })

    if (isResearcher && !member) {
      query = query.eq('is_internal', false)
    }

    const { data: comments, error } = await query.returns<CommentWithUser[]>()
    if (error) throw error

    return NextResponse.json({ comments: comments || [] })
  } catch (error) {
    console.error('Comment GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const auth = await verifyApiKey(apiKey)
    if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error || 'Invalid' }, { status: 401 })

    const body = await req.json()
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const supabase = createClient()

    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, researcher_id')
      .eq('id', params.id!)
      .returns<Row<'findings'>[]>().single()

    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

    const isResearcher = finding.researcher_id === auth.userId
    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', finding.protocol_id!)
      .eq('user_id', auth.userId!)
      .returns<Row<'protocol_members'>[]>().maybeSingle()

    if (!isResearcher && !member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const isInternal = body.is_internal === true && !!member

    const { data: comment, error } = await supabase
      .from('finding_comments')
      .insert({
        finding_id: params.id,
        user_id: auth.userId!,
        content: body.content,
        is_internal: isInternal,
      })
      .select('id, content, is_internal, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Comment POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
