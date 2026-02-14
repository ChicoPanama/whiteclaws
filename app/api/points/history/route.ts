import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { resolveIdentity } from '@/lib/auth/resolve'
import { getSeasonWeek } from '@/lib/points/engine'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Prefer session cookie auth; fall back to API key / wallet signature.
    let userId: string | null = null
    const serverClient = createServerClient()
    const { data: sessionData } = await serverClient.auth.getUser()
    if (sessionData?.user?.id) {
      userId = sessionData.user.id
    } else {
      const identity = await resolveIdentity(req)
      if (identity?.userId) userId = identity.userId
    }

    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const season = parseInt(searchParams.get('season') || String(getSeasonWeek().season))
    const eventType = searchParams.get('type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createClient()

    let query = (supabase
      .from('participation_events')
      .select('id, event_type, points, metadata, verified, season, week, created_at')
      .eq('user_id', userId)
      .eq('season', season)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1))

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    const { data: events, error } = await query

    if (error) throw error

    return NextResponse.json({
      season,
      events: events || [],
      limit,
      offset,
    })
  } catch (error) {
    console.error('Points history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
