import { NextRequest, NextResponse } from 'next/server'
import { handleCallback } from '@/lib/x/verification'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      // User denied authorization
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      return NextResponse.redirect(`${appUrl}/dashboard?x_error=denied`)
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 })
    }

    const result = await handleCallback(code, state)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

    if (!result.ok) {
      return NextResponse.redirect(`${appUrl}/dashboard?x_error=${encodeURIComponent(result.error || 'unknown')}`)
    }

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      `${appUrl}/dashboard?x_linked=${result.xHandle}&x_step=verify_tweet`
    )
  } catch (error) {
    console.error('X callback error:', error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    return NextResponse.redirect(`${appUrl}/dashboard?x_error=internal`)
  }
}
