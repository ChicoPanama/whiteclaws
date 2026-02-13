import { NextRequest, NextResponse } from 'next/server'
import { resolveIdentity } from '@/lib/auth/resolve'
import { getXStatus, getVerificationTweetTemplate } from '@/lib/x/verification'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const identity = await resolveIdentity(req)
    if (!identity) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const status = await getXStatus(identity.userId)

    // If not verified yet, include tweet template
    let tweet_template = null
    if (!status.verified) {
      const supabase = createClient()
      const { data: user } = await (supabase
        .from('users')
        .select('wallet_address, is_agent, handle')
        .eq('id', identity.userId)
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
