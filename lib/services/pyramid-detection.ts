/**
 * Anti-Sybil: Pyramid Farming Detection
 * Detects coordinated multi-level referral abuse
 */

import { createClient } from '@/lib/supabase/admin'
import { getDownlineStats } from './referral-tree'

export interface PyramidFarmingResult {
  is_farming: boolean
  risk_score: number
  flags: string[]
  downline_count: number
  qualified_ratio: number
  action: 'allow' | 'warn' | 'suppress' | 'ban'
}

/**
 * Detect pyramid farming patterns in a user's referral network
 * High-risk indicators:
 * - Large downline (100+) with very low qualification rate
 * - All downline from same IP/device cluster
 * - Downline registered in short time burst
 * - Zero accepted findings across entire network
 * - Submission copy-paste patterns
 */
export async function detectPyramidFarming(
  wallet: string
): Promise<PyramidFarmingResult> {
  const supabase = createClient()
  const w = wallet.toLowerCase()
  
  const flags: string[] = []
  let riskScore = 0.0
  
  // 1. Get downline statistics
  const downlineStats = await getDownlineStats(w)
  
  let totalDownline = 0
  let qualifiedDownline = 0
  
  for (const stat of downlineStats) {
    totalDownline += Number(stat.count)
    qualifiedDownline += Number(stat.qualified_count)
  }
  
  const qualifiedRatio = totalDownline > 0 ? qualifiedDownline / totalDownline : 0
  
  // 2. Check downline size vs qualification rate
  if (totalDownline > 100 && qualifiedRatio < 0.05) {
    flags.push('large_unqualified_network')
    riskScore += 0.5
  }
  
  if (totalDownline > 50 && qualifiedRatio < 0.1) {
    flags.push('low_qualification_rate')
    riskScore += 0.3
  }
  
  // 3. Check for IP/device clustering in downline
  const clusterCheck = await checkDownlineCluster(w)
  if (clusterCheck.clustered) {
    flags.push('downline_same_cluster')
    riskScore += 0.4
  }
  
  // 4. Check for velocity anomaly (mass registration)
  const velocityCheck = await checkRegistrationVelocity(w)
  if (velocityCheck.anomaly) {
    flags.push('mass_registration')
    riskScore += 0.35
  }
  
  // 5. Check downline contribution quality
  const qualityCheck = await checkDownlineQuality(w)
  if (qualityCheck.poor_quality) {
    flags.push('low_quality_network')
    riskScore += 0.3
  }
  
  // 6. Check for copy-paste submissions
  const copyPasteCheck = await checkCopyPastePattern(w)
  if (copyPasteCheck.detected) {
    flags.push('copy_paste_submissions')
    riskScore += 0.4
  }
  
  riskScore = Math.min(riskScore, 1.0)
  
  // Determine action based on risk score
  let action: PyramidFarmingResult['action'] = 'allow'
  if (riskScore >= 0.8) {
    action = 'ban'
  } else if (riskScore >= 0.6) {
    action = 'suppress'  // Reduce bonus multiplier
  } else if (riskScore >= 0.4) {
    action = 'warn'  // Flag for manual review
  }
  
  return {
    is_farming: riskScore >= 0.6,
    risk_score: riskScore,
    flags,
    downline_count: totalDownline,
    qualified_ratio: qualifiedRatio,
    action,
  }
}

/**
 * Check if downline wallets are from same IP/device cluster
 */
async function checkDownlineCluster(wallet: string): Promise<{ clustered: boolean; ratio: number }> {
  const supabase = createClient()
  
  // Get all downline wallets
  const { data: downline } = await supabase
    .from('referral_tree')
    .select('wallet_address')
    .eq('referrer_wallet', wallet)
    .eq('level', 1)  // Direct referrals only for this check
    .limit(100)
  
  if (!downline || downline.length < 5) {
    return { clustered: false, ratio: 0 }
  }
  
  const wallets = downline.map(d => d.wallet_address)
  
  // Check how many are flagged in same cluster
  const { data: flags } = await supabase
    .from('anti_sybil_flags')
    .select('wallet_address, cluster_id')
    .in('wallet_address', wallets)
    .not('cluster_id', 'is', null)
  
  if (!flags || flags.length === 0) {
    return { clustered: false, ratio: 0 }
  }
  
  // Count wallets per cluster
  const clusterCounts = new Map<string, number>()
  for (const flag of flags) {
    const count = clusterCounts.get(flag.cluster_id!) || 0
    clusterCounts.set(flag.cluster_id!, count + 1)
  }
  
  // If >50% of downline is in same cluster
  const maxClusterSize = Math.max(...clusterCounts.values())
  const ratio = maxClusterSize / wallets.length
  
  return {
    clustered: ratio > 0.5,
    ratio,
  }
}

/**
 * Check for mass registration velocity anomaly
 */
async function checkRegistrationVelocity(
  wallet: string
): Promise<{ anomaly: boolean; max_per_hour: number }> {
  const supabase = createClient()
  
  // Get L1 referrals with timestamps
  const { data: referrals } = await supabase
    .from('referral_tree')
    .select('wallet_address, created_at')
    .eq('referrer_wallet', wallet)
    .eq('level', 1)
    .order('created_at', { ascending: false })
    .limit(200)
  
  if (!referrals || referrals.length < 20) {
    return { anomaly: false, max_per_hour: 0 }
  }
  
  // Group by hour and count
  const hourlyBuckets = new Map<string, number>()
  
  for (const ref of referrals) {
    const hour = new Date(ref.created_at).toISOString().slice(0, 13)  // YYYY-MM-DDTHH
    const count = hourlyBuckets.get(hour) || 0
    hourlyBuckets.set(hour, count + 1)
  }
  
  const maxPerHour = Math.max(...hourlyBuckets.values())
  
  // More than 20 registrations in a single hour = anomaly
  return {
    anomaly: maxPerHour > 20,
    max_per_hour: maxPerHour,
  }
}

/**
 * Check downline contribution quality
 */
async function checkDownlineQuality(
  wallet: string
): Promise<{ poor_quality: boolean; acceptance_rate: number }> {
  const supabase = createClient()
  
  // Get all downline wallets (L1-L5)
  const { data: downline } = await supabase
    .from('referral_tree')
    .select('wallet_address')
    .eq('referrer_wallet', wallet)
  
  if (!downline || downline.length === 0) {
    return { poor_quality: false, acceptance_rate: 0 }
  }
  
  const wallets = downline.map(d => d.wallet_address)
  
  // Get user IDs for these wallets
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .in('wallet_address', wallets)
  
  if (!users || users.length === 0) {
    return { poor_quality: true, acceptance_rate: 0 }
  }
  
  const userIds = users.map(u => u.id)
  
  // Count total submissions and accepted submissions
  const { count: totalSubmissions } = await supabase
    .from('findings')
    .select('id', { count: 'exact', head: true })
    .in('researcher_id', userIds)
  
  const { count: acceptedSubmissions } = await supabase
    .from('findings')
    .select('id', { count: 'exact', head: true })
    .in('researcher_id', userIds)
    .in('status', ['accepted', 'paid'])
  
  if (!totalSubmissions || totalSubmissions === 0) {
    // No submissions yet from entire network = not poor quality, just inactive
    return { poor_quality: false, acceptance_rate: 0 }
  }
  
  const acceptanceRate = (acceptedSubmissions || 0) / totalSubmissions
  
  // If > 10 submissions with < 5% acceptance = poor quality network
  return {
    poor_quality: totalSubmissions >= 10 && acceptanceRate < 0.05,
    acceptance_rate: acceptanceRate,
  }
}

/**
 * Check for copy-paste submission patterns
 */
async function checkCopyPastePattern(
  wallet: string
): Promise<{ detected: boolean; similarity_score: number }> {
  const supabase = createClient()
  
  // Get downline wallets
  const { data: downline } = await supabase
    .from('referral_tree')
    .select('wallet_address')
    .eq('referrer_wallet', wallet)
    .limit(50)
  
  if (!downline || downline.length < 5) {
    return { detected: false, similarity_score: 0 }
  }
  
  const wallets = downline.map(d => d.wallet_address)
  
  // Get user IDs
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .in('wallet_address', wallets)
  
  if (!users) {
    return { detected: false, similarity_score: 0 }
  }
  
  const userIds = users.map(u => u.id)
  
  // Get recent submissions
  const { data: submissions } = await supabase
    .from('findings')
    .select('title, description, researcher_id')
    .in('researcher_id', userIds)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (!submissions || submissions.length < 5) {
    return { detected: false, similarity_score: 0 }
  }
  
  // Simple similarity check: count identical titles
  const titles = submissions.map(s => s.title.toLowerCase().trim())
  const uniqueTitles = new Set(titles)
  
  const similarityScore = 1 - (uniqueTitles.size / titles.length)
  
  // If > 70% of submissions have identical titles = copy-paste
  return {
    detected: similarityScore > 0.7,
    similarity_score: similarityScore,
  }
}

/**
 * Apply suppression to pyramid farmers
 * Reduces their referral bonus multiplier
 */
export async function applyPyramidSuppression(
  wallet: string,
  suppressionFactor: number = 0.1  // Reduce bonuses to 10%
): Promise<void> {
  const supabase = createClient()
  
  // Update user's contribution score multiplier
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('wallet_address', wallet.toLowerCase())
    .single()
  
  if (!userData) return
  
  await supabase
    .from('contribution_scores')
    .update({ sybil_multiplier: suppressionFactor })
    .eq('user_id', userData.id)
  
  // Flag in anti_sybil_flags table
  await supabase
    .from('anti_sybil_flags')
    .upsert({
      wallet_address: wallet.toLowerCase(),
      risk_score: 0.8,
      flags: [{ type: 'pyramid_farming', detected_at: new Date().toISOString() }] as any,
      reviewed: false,
    })
}

/**
 * Run pyramid detection across all active referrers
 * (Background job - should be run periodically)
 */
export async function scanForPyramidFarming(): Promise<{
  scanned: number
  flagged: number
  suppressed: number
}> {
  const supabase = createClient()
  
  // Get all wallets with significant downline (>20 referrals)
  const { data: referrers } = await supabase
    .from('referral_links')
    .select('wallet_address, total_referred')
    .gte('total_referred', 20)
    .order('total_referred', { ascending: false })
    .limit(1000)
  
  if (!referrers) {
    return { scanned: 0, flagged: 0, suppressed: 0 }
  }
  
  let flagged = 0
  let suppressed = 0
  
  for (const referrer of referrers) {
    const result = await detectPyramidFarming(referrer.wallet_address)
    
    if (result.is_farming) {
      flagged++
      
      if (result.action === 'suppress' || result.action === 'ban') {
        await applyPyramidSuppression(
          referrer.wallet_address,
          result.action === 'ban' ? 0 : 0.1
        )
        suppressed++
      }
    }
  }
  
  return {
    scanned: referrers.length,
    flagged,
    suppressed,
  }
}
