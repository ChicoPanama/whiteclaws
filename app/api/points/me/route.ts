import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { getCurrentSeason, getCurrentWeek, WEEKLY_CAP, TIER_WEIGHTS } from '@/lib/services/points-engine'

export const dynamic = 'force-dynamic'

/**
 * GET /api/points/me
 * Returns the authenticated user's points breakdown, penalties, rank, and recent events.
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })

    const supabase = createClient()
    const season = getCurrentSeason()
    const week = getCurrentWeek()

    // Get contribution score
    const { data: score } = await supabase
      .from('contribution_scores')
      .select('*')
      .eq('user_id', auth.userId)
      .eq('season', season)
      .maybeSingle()

    // Get recent events (last 20)
    const { data: events } = await supabase
      .from('participation_events')
      .select('event_type, points, metadata, created_at')
      .eq('user_id', auth.userId)
      .eq('season', season)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get weekly total
    const { data: weekEvents } = await supabase
      .from('participation_events')
      .select('points')
      .eq('user_id', auth.userId)
      .eq('season', season)
      .eq('week', week)
      .gt('points', 0)

    const weeklyTotal = (weekEvents || []).reduce((s, e) => s + e.points, 0)

    // Get spam flags count
    const { count: spamFlags } = await supabase
      .from('spam_flags')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.userId)

    // Get rank (count users with higher score)
    const userScore = score?.total_score || 0
    const { count: higherScores } = await supabase
      .from('contribution_scores')
      .select('id', { count: 'exact', head: true })
      .eq('season', season)
      .gt('total_score', userScore)

    const rank = (higherScores || 0) + 1

    return NextResponse.json({
      season,
      week,
      score: {
        total: score?.total_score || 0,
        security_points: score?.security_points || 0,
        growth_points: score?.growth_points || 0,
        engagement_points: score?.engagement_points || 0,
        social_points: score?.social_points || 0,
        penalty_points: score?.penalty_points || 0,
        sybil_multiplier: score?.sybil_multiplier || 1.0,
      },
      rank,
      streak_weeks: score?.streak_weeks || 0,
      weekly: {
        points_earned: weeklyTotal,
        cap: WEEKLY_CAP,
        remaining: Math.max(0, WEEKLY_CAP - weeklyTotal),
      },
      warnings: {
        spam_flags: spamFlags || 0,
        status: (spamFlags || 0) >= 5 ? 'suspended' : (spamFlags || 0) >= 2 ? 'warning' : 'clean',
      },
      tier_weights: TIER_WEIGHTS,
      recent_events: (events || []).map(e => ({
        event: e.event_type,
        points: e.points,
        at: e.created_at,
        finding_id: (e.metadata as any)?.finding_id || null,
      })),
    })
  } catch (error) {
    console.error('Points error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
