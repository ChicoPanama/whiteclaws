import { NextRequest, NextResponse } from 'next/server'
import { recalculateAllScores, applyDecay } from '@/lib/services/points-engine'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/points/recalculate
 * Recalculate all contribution scores for a season. Protected by admin secret.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const season = body.season || 1
    const withDecay = body.with_decay !== false

    const usersProcessed = await recalculateAllScores(season)

    let decayed = 0
    if (withDecay) {
      decayed = await applyDecay(season)
    }

    return NextResponse.json({
      ok: true,
      season,
      users_processed: usersProcessed,
      users_decayed: decayed,
    })
  } catch (error) {
    console.error('Recalculate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
