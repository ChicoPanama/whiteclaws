import { NextRequest, NextResponse } from 'next/server'
import { generateSnapshot } from '@/lib/claims/merkle'
import { freezeSeason, getSeasonStatus } from '@/lib/season/config'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const adminKey = process.env.ADMIN_API_KEY
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const season = parseInt(searchParams.get('season') || '1')
    const poolSizeStr = searchParams.get('pool_size')

    if (!poolSizeStr) {
      return NextResponse.json({ error: 'pool_size parameter required (in wei)' }, { status: 400 })
    }

    const poolSize = BigInt(poolSizeStr)

    // Check season status
    const status = await getSeasonStatus(season)
    if (status === 'active') {
      // Auto-freeze
      await freezeSeason(season)
    }

    const result = await generateSnapshot(season, poolSize)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      season,
      merkle_root: result.merkleRoot,
      total_participants: result.allocations?.length || 0,
      pool_size: poolSizeStr,
      top_allocations: (result.allocations || []).slice(0, 10).map((a) => ({
        wallet: a.wallet_address,
        score: a.total_score,
        share_pct: (a.share_pct * 100).toFixed(4) + '%',
        amount: a.allocation_amount.toString(),
      })),
    })
  } catch (error) {
    console.error('Snapshot error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
