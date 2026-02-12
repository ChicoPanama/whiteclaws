import { NextRequest, NextResponse } from 'next/server'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { applyReferralCode } from '@/lib/referral/engine'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const key = extractApiKey(req)
    if (!key) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

    const auth = await verifyApiKey(key)
    if (!auth.valid) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    if (!auth.userId) return NextResponse.json({ error: 'No user ID' }, { status: 401 })

    const body = await req.json()
    const { referral_code } = body

    if (!referral_code) {
      return NextResponse.json({ error: 'referral_code is required' }, { status: 400 })
    }

    const result = await applyReferralCode(auth.userId, referral_code)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: 'Referral applied. Bonus pending qualification.' })
  } catch (error) {
    console.error('Referral apply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
