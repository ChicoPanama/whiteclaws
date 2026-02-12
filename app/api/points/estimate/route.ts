import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { resolveIdentity } from '@/lib/auth/resolve'
import { getSeasonWeek } from '@/lib/points/engine'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const identity = await resolveIdentity(req)
    if (!identity) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = createClient()
    const { season } = getSeasonWeek()

    // Get user's score
    const { data: userScore } = await (supabase
      .from('contribution_scores' as any)
      .select('total_score, rank')
      .eq('user_id', identity.userId)
      .eq('season', season)
      .maybeSingle() as any)

    // Get total scores across all users
    const { data: allScores } = await (supabase
      .from('contribution_scores' as any)
      .select('total_score')
      .eq('season', season)
      .gt('total_score', 0) as any)

    const totalPoolScore = (allScores || []).reduce((sum: number, s: any) => sum + (s.total_score || 0), 0)
    const totalParticipants = allScores?.length || 0
    const myScore = userScore?.total_score || 0
    const sharePercent = totalPoolScore > 0 ? (myScore / totalPoolScore) * 100 : 0

    // Get season pool size (if set)
    const { data: seasonConfig } = await (supabase
      .from('season_config' as any)
      .select('pool_size, status')
      .eq('season', season)
      .maybeSingle() as any)

    const poolSize = seasonConfig?.pool_size || null

    return NextResponse.json({
      season,
      season_status: seasonConfig?.status || 'pending',
      your_score: myScore,
      your_rank: userScore?.rank || null,
      total_pool_score: totalPoolScore,
      total_participants: totalParticipants,
      your_share_percent: Math.round(sharePercent * 1000) / 1000,
      pool_size: poolSize,
      estimated_allocation: poolSize ? Math.floor((myScore / totalPoolScore) * poolSize) : 'TBD — pool size not set',
    })
  } catch (error) {
    console.error('Points estimate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
