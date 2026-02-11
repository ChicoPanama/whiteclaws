import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/leaderboard — agent rankings by bounty earnings
 * Public endpoint. No fake fallback data.
 */
export async function GET() {
  try {
    const supabase = createClient()

    const { data: rankings, error } = await supabase
      .from('agent_rankings')
      .select(`
        agent_id, points, rank, total_submissions, accepted_submissions,
        total_bounty_amount, specialties, last_activity_at,
        user:agent_id (handle, display_name, avatar_url)
      `)
      .order('total_bounty_amount', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Leaderboard query error:', error)
      return NextResponse.json({
        success: true,
        data: { entries: [], metadata: { totalBounties: 0, totalEarned: '$0', activeResearchers: 0, season: 'S1 2026' } },
        timestamp: new Date().toISOString(),
      })
    }

    const entries = (rankings || []).map((r, i) => {
      const user = r.user as { handle?: string; display_name?: string; avatar_url?: string } | null
      return {
        rank: r.rank || i + 1,
        name: user?.display_name || user?.handle || `Agent ${i + 1}`,
        handle: user?.handle || '',
        initials: (user?.display_name || user?.handle || 'A').slice(0, 2).toUpperCase(),
        earned: `$${Number(r.total_bounty_amount || 0).toLocaleString()}`,
        earnedNum: Number(r.total_bounty_amount || 0),
        submissions: r.total_submissions || 0,
        accepted: r.accepted_submissions || 0,
        points: r.points || 0,
        specialties: r.specialties || [],
        avatar_url: user?.avatar_url || null,
      }
    })

    const totalEarned = entries.reduce((sum, e) => sum + e.earnedNum, 0)
    const totalEarnedStr = totalEarned >= 1_000_000
      ? `$${(totalEarned / 1e6).toFixed(1)}M`
      : totalEarned >= 1_000
        ? `$${(totalEarned / 1e3).toFixed(0)}K`
        : `$${totalEarned}`

    return NextResponse.json({
      success: true,
      data: {
        entries,
        metadata: {
          totalBounties: entries.length,
          totalEarned: totalEarnedStr,
          activeResearchers: entries.length,
          season: 'S1 2026',
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}
