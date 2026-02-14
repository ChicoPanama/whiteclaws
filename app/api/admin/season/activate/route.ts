import { NextRequest, NextResponse } from 'next/server'
import { activateSeason } from '@/lib/season/config'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
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
}
