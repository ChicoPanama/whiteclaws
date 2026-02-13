import { NextRequest, NextResponse } from 'next/server'
import { resolveIdentity } from '@/lib/auth/resolve'
import { generateAuthUrl } from '@/lib/x/verification'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const identity = await resolveIdentity(req)
    if (!identity) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!process.env.X_CLIENT_ID) {
      return NextResponse.json({
        error: 'X/Twitter OAuth not configured. Set X_CLIENT_ID, X_CLIENT_SECRET, X_CALLBACK_URL.',
      }, { status: 503 })
    }

    const authUrl = generateAuthUrl(identity.userId)

    return NextResponse.json({ auth_url: authUrl })
  } catch (error) {
    console.error('X auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
