import { NextRequest, NextResponse } from 'next/server'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { getReferralStats } from '@/lib/referral/engine'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    let userId: string | null = null

    const serverClient = createServerClient()
    const { data: sessionData } = await serverClient.auth.getUser()
    if (sessionData?.user?.id) {
      userId = sessionData.user.id
    } else {
      const key = extractApiKey(req)
      if (key) {
        const auth = await verifyApiKey(key)
        if (auth.valid && auth.userId) userId = auth.userId
      }
    }

    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const stats = await getReferralStats(userId)

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
