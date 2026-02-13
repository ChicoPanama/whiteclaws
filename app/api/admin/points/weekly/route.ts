import { NextRequest, NextResponse } from 'next/server'
import { processWeeklyActivity } from '@/lib/points/weekly'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/points/weekly
 * Trigger weekly activity processing. Protected by admin secret.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await processWeeklyActivity()

    return NextResponse.json({
      ok: true,
      ...result,
      message: `Processed ${result.processed} SBT holders. ${result.activeUsers} active, ${result.streakBonuses} streak bonuses.`,
    })
  } catch (error) {
    console.error('Weekly points error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
