import { NextRequest, NextResponse } from 'next/server'
import { resolveIdentity } from '@/lib/auth/resolve'
import { verifyTweet } from '@/lib/x/verification'
import { fireEvent } from '@/lib/points/hooks'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const identity = await resolveIdentity(req)
    if (!identity) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { tweet_id, tweet_url } = body

    // Accept either tweet_id or tweet_url
    let resolvedTweetId = tweet_id
    if (!resolvedTweetId && tweet_url) {
      // Extract tweet ID from URL like https://x.com/user/status/123456789
      const match = tweet_url.match(/\/status\/(\d+)/)
      resolvedTweetId = match?.[1]
    }

    if (!resolvedTweetId) {
      return NextResponse.json({ error: 'tweet_id or tweet_url is required' }, { status: 400 })
    }

    const result = await verifyTweet(identity.userId, resolvedTweetId)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Fire x_claimed points event
    fireEvent(identity.userId, 'x_claimed', { tweet_id: resolvedTweetId })

    return NextResponse.json({
      ok: true,
      message: 'X account verified! Your wallet is now linked to your X handle.',
    })
  } catch (error) {
    console.error('X verify-tweet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
