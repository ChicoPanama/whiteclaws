import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getDownlineStats } from '@/lib/services/referral-tree'
import { getTotalBonusesEarned } from '@/lib/services/referral-bonuses'

export const dynamic = 'force-dynamic'

/**
 * GET /api/referral/network
 * Get user's referral network statistics
 * 
 * Query params:
 *   - season (optional): Season number (default: current season)
 * 
 * Returns:
 *   - Referral code and link
 *   - Downline stats by level (L1-L5)
 *   - Total bonuses earned
 *   - Direct referrals list
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    
    // Get user's wallet address
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('wallet_address, handle')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData?.wallet_address) {
      return NextResponse.json({ error: 'User wallet not found' }, { status: 404 })
    }

    const walletAddress = userData.wallet_address.toLowerCase()
    const { searchParams } = new URL(req.url)
    const season = parseInt(searchParams.get('season') || '1', 10)

    // Get referral link
    const { data: referralLink } = await adminSupabase
      .from('referral_links')
      .select('code, total_referred, qualified_referred')
      .eq('wallet_address', walletAddress)
      .single()

    // Get downline stats (L1-L5)
    const downlineStats = await getDownlineStats(walletAddress)
    
    // Transform downline stats into level breakdown
    const networkStats = {
      L1: 0,
      L2: 0,
      L3: 0,
      L4: 0,
      L5: 0,
      total: 0,
      qualified_total: 0,
    }

    for (const stat of downlineStats) {
      networkStats[`L${stat.level}` as keyof typeof networkStats] = Number(stat.count)
      networkStats.total += Number(stat.count)
      networkStats.qualified_total += Number(stat.qualified_count)
    }

    // Get direct referrals (L1) with details
    const { data: directReferrals } = await adminSupabase
      .from('referral_tree')
      .select(`
        wallet_address,
        qualified,
        qualified_at,
        qualifying_action
      `)
      .eq('referrer_wallet', walletAddress)
      .eq('level', 1)
      .order('created_at', { ascending: false })
      .limit(50)

    // Enrich with user info
    const enrichedReferrals = await Promise.all(
      (directReferrals || []).map(async (ref) => {
        const { data: refUser } = await adminSupabase
          .from('users')
          .select('handle, display_name, avatar_url, reputation_score')
          .eq('wallet_address', ref.wallet_address)
          .single()

        return {
          wallet: ref.wallet_address,
          handle: refUser?.handle || null,
          name: refUser?.display_name || null,
          avatar: refUser?.avatar_url || null,
          reputation: refUser?.reputation_score || 0,
          qualified: ref.qualified,
          qualified_at: ref.qualified_at,
          qualifying_action: ref.qualifying_action,
        }
      })
    )

    // Get bonuses earned
    const bonusesEarned = await getTotalBonusesEarned(walletAddress, season)

    return NextResponse.json({
      referral: {
        code: referralLink?.code || null,
        link: referralLink?.code ? `https://whiteclaws.xyz/ref/${referralLink.code}` : null,
        total_referred: referralLink?.total_referred || 0,
        qualified_referred: referralLink?.qualified_referred || 0,
      },
      network: networkStats,
      bonuses_earned: {
        total_points: bonusesEarned.total_points,
        by_level: bonusesEarned.by_level,
        season,
      },
      direct_referrals: enrichedReferrals,
    })
  } catch (error) {
    console.error('[ReferralNetwork] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
