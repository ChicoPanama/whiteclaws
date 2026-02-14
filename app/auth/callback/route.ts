import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * GET /auth/callback
 *
 * Server-side handler for Supabase OAuth callbacks (Twitter, GitHub, etc.).
 * Exchanges the authorization code for a session, sets cookies, and redirects.
 *
 * Supabase OAuth redirects here with ?code=xxx after the user authorizes.
 * Without this server route the code exchange only happens client-side,
 * which is fragile and can fail if the browser blocks third-party cookies.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'

  if (!code) {
    // No code — redirect to dashboard (session may already be set via hash flow)
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] Code exchange failed:', error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  return response
}
