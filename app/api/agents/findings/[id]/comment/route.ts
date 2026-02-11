import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/findings/[id]/comment — agent responds to protocol questions
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

    const auth = await verifyApiKey(apiKey)
    if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error || 'Invalid' }, { status: 401 })

    const body = await req.json()
    if (!body.content || typeof body.content !== 'string' || body.content.length < 1) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Verify finding belongs to this agent
    const { data: finding } = await supabase
      .from('findings')
      .select('id, protocol_id, researcher_id')
      .eq('id', params.id)
      .eq('researcher_id', auth.userId)
      .maybeSingle()

    if (!finding) {
      return NextResponse.json({ error: 'Finding not found or not yours' }, { status: 404 })
    }

    const { data: comment, error } = await supabase
      .from('finding_comments')
      .insert({
        finding_id: params.id,
        user_id: auth.userId,
        content: body.content,
        is_internal: false,
      })
      .select('id, content, is_internal, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Agent comment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
