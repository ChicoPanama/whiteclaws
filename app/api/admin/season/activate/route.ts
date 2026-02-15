import { NextRequest, NextResponse } from 'next/server'
import { activateSeason } from '@/lib/season/config'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET
    const authHeader = req.headers.get('authorization')
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const season = body.season || 1
    const poolSize = body.pool_size
    const weeklyCap = body.weekly_cap

    const result = await activateSeason(season, poolSize, weeklyCap)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: `Season ${season} activated`, season })
  } catch (error) {
    console.error('Season activation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
