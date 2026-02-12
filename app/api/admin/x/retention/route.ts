import { NextRequest, NextResponse } from 'next/server'
import { checkTweetRetention } from '@/lib/x/verification'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/x/retention
 * Check tweet retention for verified X accounts. Run daily via cron.
 * Protected by admin secret.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await checkTweetRetention()

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Tweet retention check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
