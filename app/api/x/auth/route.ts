import { NextRequest, NextResponse } from 'next/server'
import { resolveIdentity } from '@/lib/auth/resolve'
import { generateAuthUrl } from '@/lib/x/verification'
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

    if (!process.env.X_CLIENT_ID) {
      return NextResponse.json({
        error: 'X/Twitter OAuth not configured. Set X_CLIENT_ID, X_CLIENT_SECRET, X_CALLBACK_URL.',
      }, { status: 503 })
    }

    const authUrl = await generateAuthUrl(userId)

    return NextResponse.json({ auth_url: authUrl })
  } catch (error) {
    console.error('X auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
