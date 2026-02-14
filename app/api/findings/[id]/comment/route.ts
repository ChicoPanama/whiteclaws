import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'
import { getForwardedIp, requireProtocolMember, requireSessionUserId } from '@/lib/auth/protocol-guards'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'
import { hashKey } from '@/lib/rate-limit/keys'

export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()
const commentSchema = z.object({
  content: z.string().min(1).max(10_000),
  is_internal: z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSessionUserId()
    if (!session.ok) return session.res

    const parsedId = idSchema.safeParse(params.id)
    if (!parsedId.success) {
      return NextResponse.json({ error: 'Validation error', details: parsedId.error.issues }, { status: 400 })
    }

    const supabase = createClient()

    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, researcher_id')
      .eq('id', parsedId.data)
      .returns<Row<'findings'>[]>().single()

    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

    const isResearcher = finding.researcher_id === session.userId
    const membership = isResearcher ? { ok: true as const } : await requireProtocolMember(session.userId, finding.protocol_id!)

    if (!membership.ok) return membership.res

    interface CommentWithUser {
      id: string; content: string; is_internal: boolean; created_at: string
      user: { id: string; handle: string; display_name: string | null } | null
    }

    let query = supabase
      .from('finding_comments')
      .select('id, content, is_internal, created_at, user:user_id (id, handle, display_name)')
      .eq('finding_id', params.id!)
      .order('created_at', { ascending: true })

    // Researchers can only see public comments. Protocol members can see internal notes.
    if (isResearcher) {
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
    const session = await requireSessionUserId()
    if (!session.ok) return session.res

    const ip = getForwardedIp(req)
    const rl = await checkRateLimit({ key: `finding_comment:${hashKey(ip)}`, limit: 30, windowSeconds: 60 })
    if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const parsedId = idSchema.safeParse(params.id)
    if (!parsedId.success) {
      return NextResponse.json({ error: 'Validation error', details: parsedId.error.issues }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const parsedBody = commentSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Validation error', details: parsedBody.error.issues }, { status: 400 })
    }

    const supabase = createClient()

    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, researcher_id')
      .eq('id', parsedId.data)
      .returns<Row<'findings'>[]>().single()

    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

    const isResearcher = finding.researcher_id === session.userId
    const membership = isResearcher ? { ok: true as const } : await requireProtocolMember(session.userId, finding.protocol_id!)

    if (!membership.ok) return membership.res

    const isInternal = parsedBody.data.is_internal === true && !isResearcher

    const { data: comment, error } = await supabase
      .from('finding_comments')
      .insert({
        finding_id: params.id,
        user_id: session.userId,
        content: parsedBody.data.content,
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
