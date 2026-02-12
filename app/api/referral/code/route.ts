import { NextRequest, NextResponse } from 'next/server'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { getOrCreateReferralCode } from '@/lib/referral/engine'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const key = extractApiKey(req)
    if (!key) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

    const auth = await verifyApiKey(key)
    if (!auth.valid) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    if (!auth.userId) return NextResponse.json({ error: 'No user ID' }, { status: 401 })

    const result = await getOrCreateReferralCode(auth.userId)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ code: result.code, link: `https://whiteclaws.xyz/ref/${result.code}` })
  } catch (error) {
    console.error('Referral code error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
