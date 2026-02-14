import { NextRequest, NextResponse } from 'next/server'
import { resolveIdentity } from '@/lib/auth/resolve'
import { getXStatus, getVerificationTweetTemplate } from '@/lib/x/verification'
import { createClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Prefer session cookie auth; fall back to API key / wallet signature.
    let userId: string | null = null
    const serverClient = createServerClient()
    const { data: sessionData } = await serverClient.auth.getUser()
    if (sessionData?.user?.id) {
      userId = sessionData.user.id
    } else {
      const identity = await resolveIdentity(req)
      if (identity?.userId) userId = identity.userId
    }

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const status = await getXStatus(userId)

    // If not verified yet, include tweet template
    let tweet_template = null
    if (!status.verified) {
      const supabase = createClient()
      const { data: user } = await (supabase
        .from('users')
        .select('wallet_address, is_agent, handle')
        .eq('id', userId)
        .single())

      if (user?.wallet_address) {
        const userType = user.is_agent ? 'agent' : 'human'
        tweet_template = getVerificationTweetTemplate(
          userType as 'agent' | 'human' | 'protocol',
          user.wallet_address,
          user.handle || ''
        )
      }
    }

    return NextResponse.json({
      ...status,
      tweet_template,
    })
  } catch (error) {
    console.error('X status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
