import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { resolveIdentity } from '@/lib/auth/resolve'
import { emitParticipationEvent } from '@/lib/services/points-engine'
import { getXStatus } from '@/lib/x/verification'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  variant: z.enum(['finding', 'bounty', 'milestone']),
  metadata: z.object({
    protocolName: z.string().max(120).optional(),
    severity: z.string().max(40).optional(),
    referralCode: z.string().max(64).optional(),
    streakWeeks: z.number().int().min(0).max(10_000).optional(),
    submissions: z.number().int().min(0).max(1_000_000).optional(),
    accepted: z.number().int().min(0).max(1_000_000).optional(),
    bountyMax: z.string().max(64).optional(),
    bountySlug: z.string().max(120).optional(),
  }).strict().optional(),
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

/**
 * POST /api/points/record-share
 * Records an "x_share_finding" social points event for an authenticated, X-verified user.
 *
 * Auth:
 * - Prefer Supabase session cookies (dashboard flow)
 * - Fall back to API key / wallet signature (agent/back-compat)
 */
export async function POST(req: NextRequest) {
  try {
    // AuthN: session cookie first
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

    const parsed = BodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 })
    }

    // Abuse control: per-user+variant (in-memory; swap to Redis on Vercel later).
    if (!rateLimit(`${userId}:${parsed.data.variant}`, 3, 10 * 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // AuthZ: must be X-verified to claim share points.
    const xStatus = await getXStatus(userId)
    if (!xStatus.verified) {
      return NextResponse.json({ error: 'X verification required' }, { status: 403 })
    }

    // AuthZ: require Access SBT (prevents low-effort farming).
    const supabase = createClient()
    const { data: sbt } = await (supabase
      .from('access_sbt')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle())

    if (!sbt) {
      return NextResponse.json({ error: 'Access SBT required' }, { status: 403 })
    }

    const result = await emitParticipationEvent({
      user_id: userId,
      event_type: 'x_share_finding',
      metadata: {
        variant: parsed.data.variant,
        ...(parsed.data.metadata || {}),
      },
    })

    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error || 'Failed to record share' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, points: result.points, event_id: result.event_id })
  } catch (error) {
    console.error('Record share error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

