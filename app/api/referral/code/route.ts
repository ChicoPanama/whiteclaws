import { NextRequest, NextResponse } from 'next/server'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { getOrCreateReferralCode } from '@/lib/referral/engine'
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

    const result = await getOrCreateReferralCode(userId)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ code: result.code, link: `https://whiteclaws.xyz/ref/${result.code}` })
  } catch (error) {
    console.error('Referral code error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
