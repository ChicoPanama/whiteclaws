import { NextRequest, NextResponse } from 'next/server'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { getReferralStats } from '@/lib/referral/engine'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const key = extractApiKey(req)
    if (!key) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

    const auth = await verifyApiKey(key)
    if (!auth.valid) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    if (!auth.userId) return NextResponse.json({ error: 'No user ID' }, { status: 401 })

    const stats = await getReferralStats(auth.userId)

    return NextResponse.json({
      referral: {
        code: stats.code,
        link: stats.code ? `https://whiteclaws.xyz/ref/${stats.code}` : null,
        total_referred: stats.total_referred,
        qualified_referred: stats.qualified_referred,
        bonus_earned: stats.bonus_earned,
        recent_rewards: stats.rewards.slice(0, 10),
      },
    })
  } catch (error) {
    console.error('Referral stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
