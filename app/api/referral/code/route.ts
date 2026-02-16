import { NextRequest, NextResponse } from 'next/server'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/referral/code
 * Get or create user's referral code (wallet-based)
 */
export async function GET(req: NextRequest) {
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

    const adminSupabase = createAdminClient()

    // Get user's wallet address
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('wallet_address')
      .eq('id', userId)
      .single()

    if (userError || !userData?.wallet_address) {
      return NextResponse.json({ error: 'User wallet not found' }, { status: 404 })
    }

    const walletAddress = userData.wallet_address.toLowerCase()

    // Get or create referral link
    let { data: referralLink, error: linkError } = await adminSupabase
      .from('referral_links')
      .select('code, total_referred, qualified_referred')
      .eq('wallet_address', walletAddress)
      .single()

    // If not found, create one (edge case: trigger didn't fire)
    if (linkError || !referralLink) {
      const newCode = `wc-${Math.random().toString(36).substring(2, 8)}`

      const { data: newLink, error: createError } = await adminSupabase
        .from('referral_links')
        .insert({
          referrer_id: userId,
          wallet_address: walletAddress,
          code: newCode,
        })
        .select('code, total_referred, qualified_referred')
        .single()

      if (createError) {
        console.error('[ReferralCode] Create error:', createError)
        return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 })
      }

      referralLink = newLink
    }

    return NextResponse.json({
      code: referralLink.code,
      link: `https://whiteclaws.xyz/ref/${referralLink.code}`,
      stats: {
        total_referred: referralLink.total_referred || 0,
        qualified_referred: referralLink.qualified_referred || 0,
      }
    })
  } catch (error) {
    console.error('Referral code error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
