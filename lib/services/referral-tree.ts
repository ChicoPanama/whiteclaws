/**
 * Referral Tree Builder
 * Constructs multi-level referral relationships (L1-L5)
 */

import { createClient } from '@/lib/supabase/admin'

const MAX_REFERRAL_DEPTH = 5

export interface BuildTreeResult {
  success: boolean
  levels_created: number
  error?: string
  upline_path?: string[]
}

/**
 * Build referral tree for a new user
 * Creates L1-L5 relationships based on referrer's existing upline
 */
export async function buildReferralTree(
  newWallet: string,
  referralCode: string
): Promise<BuildTreeResult> {
  const supabase = createClient()
  const wallet = newWallet.toLowerCase()
  
  // 1. Find direct referrer by code
  const { data: link, error: linkError } = await supabase
    .from('referral_links')
    .select('wallet_address')
    .eq('code', referralCode)
    .single()
  
  if (linkError || !link) {
    return { success: false, levels_created: 0, error: 'Invalid referral code' }
  }
  
  const referrerWallet = link.wallet_address.toLowerCase()
  
  // 2. Prevent self-referral
  if (wallet === referrerWallet) {
    return { success: false, levels_created: 0, error: 'Cannot refer yourself' }
  }
  
  // 3. Check for circular referral using DB function
  const { data: isCircular, error: circularError } = await supabase
    .rpc('check_circular_referral', {
      new_wallet: wallet,
      referrer_wallet: referrerWallet,
    })
  
  if (circularError) {
    console.error('[ReferralTree] Error checking circular:', circularError)
    return { success: false, levels_created: 0, error: 'Failed to verify referral chain' }
  }
  
  if (isCircular) {
    return { success: false, levels_created: 0, error: 'Circular referral detected' }
  }
  
  // 4. Get referrer's upline (L1-L4, since new user will be L1 from referrer)
  const { data: referrerUpline, error: uplineError } = await supabase
    .from('referral_tree')
    .select('referrer_wallet, level, upline_path')
    .eq('wallet_address', referrerWallet)
    .order('level', { ascending: true })
    .limit(MAX_REFERRAL_DEPTH - 1)
  
  if (uplineError) {
    console.error('[ReferralTree] Error fetching upline:', uplineError)
    // Continue anyway - referrer might be top-level (no upline)
  }
  
  // 5. Build upline path for new user
  const uplinePath: string[] = [referrerWallet]
  
  if (referrerUpline && referrerUpline.length > 0) {
    // Add referrer's ancestors (up to L5 total depth)
    for (const ancestor of referrerUpline) {
      if (uplinePath.length < MAX_REFERRAL_DEPTH) {
        uplinePath.push(ancestor.referrer_wallet)
      }
    }
  }
  
  // 6. Insert tree entries for each level
  const treeEntries = uplinePath.map((referrer, index) => ({
    wallet_address: wallet,
    referrer_wallet: referrer,
    level: index + 1,
    upline_path: uplinePath.slice(0, index + 1),
    qualified: false,
  }))
  
  const { error: insertError } = await supabase
    .from('referral_tree')
    .insert(treeEntries)
  
  if (insertError) {
    console.error('[ReferralTree] Insert error:', insertError)
    return { success: false, levels_created: 0, error: 'Failed to create referral tree' }
  }
  
  // 7. Update referrer's total_referred count
  await supabase
    .from('referral_links')
    .update({ total_referred: supabase.sql`total_referred + 1` })
    .eq('wallet_address', referrerWallet)
  
  return {
    success: true,
    levels_created: treeEntries.length,
    upline_path: uplinePath,
  }
}

/**
 * Qualify a user's referral relationships when they complete qualifying action
 * (e.g., first accepted finding)
 */
export async function qualifyReferralTree(
  wallet: string,
  qualifyingAction: string
): Promise<{ qualified_count: number }> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('referral_tree')
    .update({
      qualified: true,
      qualifying_action: qualifyingAction,
      qualified_at: new Date().toISOString(),
    })
    .eq('wallet_address', wallet.toLowerCase())
    .eq('qualified', false)
    .select('id')
  
  if (error) {
    console.error('[ReferralTree] Qualification error:', error)
    return { qualified_count: 0 }
  }
  
  // Update referrer's qualified_referred count (only for L1)
  const { data: l1Referrer } = await supabase
    .from('referral_tree')
    .select('referrer_wallet')
    .eq('wallet_address', wallet.toLowerCase())
    .eq('level', 1)
    .single()
  
  if (l1Referrer) {
    await supabase
      .from('referral_links')
      .update({ qualified_referred: supabase.sql`qualified_referred + 1` })
      .eq('wallet_address', l1Referrer.referrer_wallet)
  }
  
  return { qualified_count: data?.length || 0 }
}

/**
 * Get user's downline statistics by level
 */
export async function getDownlineStats(wallet: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('get_downline_stats', { ancestor_wallet: wallet.toLowerCase() })
  
  if (error) {
    console.error('[ReferralTree] Downline stats error:', error)
    return []
  }
  
  return data || []
}

/**
 * Get user's full upline (all ancestors up to L5)
 */
export async function getUpline(wallet: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('referral_tree')
    .select('referrer_wallet, level, qualified')
    .eq('wallet_address', wallet.toLowerCase())
    .order('level', { ascending: true })
  
  if (error) {
    console.error('[ReferralTree] Upline fetch error:', error)
    return []
  }
  
  return data || []
}

/**
 * Check if a wallet has been referred (has any upline)
 */
export async function hasReferrer(wallet: string): Promise<boolean> {
  const supabase = createClient()
  
  const { count, error } = await supabase
    .from('referral_tree')
    .select('id', { count: 'exact', head: true })
    .eq('wallet_address', wallet.toLowerCase())
    .eq('level', 1)
  
  if (error) return false
  return (count || 0) > 0
}
