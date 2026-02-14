import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveIdentity } from '@/lib/auth/resolve'
import { verifyTweet } from '@/lib/x/verification'
import { fireEvent } from '@/lib/points/hooks'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  tweet_id: z.string().regex(/^\d+$/).optional(),
  tweet_url: z.string().url().optional(),
}).strict()

type RateEntry = { count: number; resetAt: number }
const rateLimitState = new Map<string, RateEntry>()

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitState.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitState.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count += 1
  return true
}

export async function POST(req: NextRequest) {
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

    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    if (!rateLimit(`x-verify:${userId}`, 5, 60 * 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 })
    }

    const { tweet_id, tweet_url } = parsed.data

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

    const result = await verifyTweet(userId, resolvedTweetId)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Fire x_claimed points event
    fireEvent(userId, 'x_claimed', { tweet_id: resolvedTweetId })

    return NextResponse.json({
      ok: true,
      message: 'X account verified! Your wallet is now linked to your X handle.',
    })
  } catch (error) {
    console.error('X verify-tweet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
