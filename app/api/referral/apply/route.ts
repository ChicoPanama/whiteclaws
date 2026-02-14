import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { applyReferralCode } from '@/lib/referral/engine'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  referral_code: z.string().min(3).max(64),
}).strict()

export async function POST(req: NextRequest) {
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

    const rl = await checkRateLimit({ key: `ref-apply:${userId}`, limit: 10, windowSeconds: 60 * 60 })
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 })
    }

    const { referral_code } = parsed.data
    const result = await applyReferralCode(userId, referral_code)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: 'Referral applied. Bonus pending qualification.' })
  } catch (error) {
    console.error('Referral apply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
