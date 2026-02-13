import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { getCurrentSeason } from '@/lib/services/points-engine'

export const dynamic = 'force-dynamic'

/**
 * GET /api/points/leaderboard
 * Public leaderboard — top users by total_score for current season.
 * Supports ?season=N&limit=N&offset=N
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const supabase = createClient()
    const season = parseInt(searchParams.get('season') || String(getCurrentSeason()))
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data, error } = await supabase
      .from('contribution_scores')
      .select(`
        user_id,
        total_score,
        security_points,
        growth_points,
        engagement_points,
        social_points,
        streak_weeks,
        sybil_multiplier
      `)
      .eq('season', season)
      .gt('total_score', 0)
      .order('total_score', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Fetch user display info
    const userIds = (data || []).map(d => d.user_id)
    const { data: users } = await supabase
      .from('users')
      .select('id, handle, display_name, avatar_url, wallet_address, is_agent')
      .in('id', userIds)

    const userMap = new Map((users || []).map(u => [u.id, u]))

    const leaderboard = (data || []).map((entry, idx) => {
      const user = userMap.get(entry.user_id)
      return {
        rank: offset + idx + 1,
        handle: user?.handle || user?.display_name || `agent-${entry.user_id.slice(0, 6)}`,
        avatar_url: user?.avatar_url || null,
        is_agent: user?.is_agent || false,
        wallet: user?.wallet_address ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}` : null,
        total_score: entry.total_score,
        security_points: entry.security_points,
        growth_points: entry.growth_points,
        engagement_points: entry.engagement_points,
        social_points: entry.social_points,
        streak_weeks: entry.streak_weeks,
      }
    })

    return NextResponse.json({ season, leaderboard, limit, offset })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
