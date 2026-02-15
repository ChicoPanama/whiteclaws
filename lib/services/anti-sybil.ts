/**
 * Anti-Sybil: Wallet Clustering Detection
 * Identifies coordinated farming attempts across multiple wallets
 */

import { createClient } from '@/lib/supabase/admin'

export interface WalletClusteringResult {
  valid: boolean
  risk_score: number
  flags: string[]
  reason?: string
  cluster_id?: string
}

export interface SybilCheckResult {
  is_sybil: boolean
  risk_score: number
  flags: string[]
  cluster_id?: string
}

/**
 * Check if two wallets are part of a Sybil cluster
 * Used during referral registration to prevent coordinated farming
 */
export async function checkWalletClustering(
  wallet1: string,
  wallet2: string,
  context?: {
    ip_address?: string
    user_agent?: string
    device_fingerprint?: string
  }
): Promise<WalletClusteringResult> {
  const supabase = createClient()
  const w1 = wallet1.toLowerCase()
  const w2 = wallet2.toLowerCase()
  
  const flags: string[] = []
  let riskScore = 0.0

  // 1. Check if wallets are funded from same source
  const fundingMatch = await checkFundingSource(w1, w2)
  if (fundingMatch.match) {
    flags.push('same_funding_source')
    riskScore += 0.4
  }

  // 2. Check IP address clustering (if provided)
  if (context?.ip_address) {
    const ipCluster = await checkIPClustering(w1, w2, context.ip_address)
    if (ipCluster.clustered) {
      flags.push('same_ip_cluster')
      riskScore += 0.3
    }
  }

  // 3. Check device fingerprinting (if provided)
  if (context?.device_fingerprint) {
    const deviceMatch = await checkDeviceFingerprint(w1, w2, context.device_fingerprint)
    if (deviceMatch.match) {
      flags.push('same_device')
      riskScore += 0.35
    }
  }

  // 4. Check submission timing patterns
  const timingAnomaly = await checkSubmissionTiming(w1, w2)
  if (timingAnomaly.suspicious) {
    flags.push('suspicious_timing')
    riskScore += 0.2
  }

  // 5. Check if wallets already flagged in same cluster
  const existingCluster = await getExistingCluster(w1, w2)
  if (existingCluster.found) {
    flags.push('known_cluster')
    riskScore += 0.5
  }

  // Cap risk score at 1.0
  riskScore = Math.min(riskScore, 1.0)

  // Determine validity (< 0.6 = allowed with monitoring, >= 0.6 = blocked)
  const valid = riskScore < 0.6

  return {
    valid,
    risk_score: riskScore,
    flags,
    reason: !valid ? 'Wallets appear to be part of coordinated Sybil cluster' : undefined,
    cluster_id: existingCluster.cluster_id,
  }
}

/**
 * Check if wallets were funded from the same EOA
 * This is a strong Sybil signal
 */
async function checkFundingSource(
  wallet1: string,
  wallet2: string
): Promise<{ match: boolean; source?: string }> {
  // TODO: Implement on-chain analysis
  // For now, check if we've previously recorded funding sources
  const supabase = createClient()
  
  const { data: w1Data } = await supabase
    .from('anti_sybil_flags')
    .select('flags')
    .eq('wallet_address', wallet1)
    .single()
  
  const { data: w2Data } = await supabase
    .from('anti_sybil_flags')
    .select('flags')
    .eq('wallet_address', wallet2)
    .single()
  
  // Extract funding sources from flags if present
  const w1Funding = (w1Data?.flags as any[])?.find(f => f.type === 'funding_source')?.value
  const w2Funding = (w2Data?.flags as any[])?.find(f => f.type === 'funding_source')?.value
  
  if (w1Funding && w2Funding && w1Funding === w2Funding) {
    return { match: true, source: w1Funding }
  }
  
  return { match: false }
}

/**
 * Check if multiple wallets are registering from the same IP
 */
async function checkIPClustering(
  wallet1: string,
  wallet2: string,
  currentIP: string
): Promise<{ clustered: boolean; count: number }> {
  const supabase = createClient()
  
  // Check how many wallets registered from this IP in last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  const { data: recentRegistrations } = await supabase
    .from('anti_sybil_flags')
    .select('wallet_address')
    .contains('flags', [{ type: 'ip_address', value: currentIP }])
    .gte('created_at', oneDayAgo)
  
  const count = recentRegistrations?.length || 0
  
  // More than 5 wallets from same IP in 24h = suspicious
  return {
    clustered: count >= 5,
    count,
  }
}

/**
 * Check device fingerprinting
 */
async function checkDeviceFingerprint(
  wallet1: string,
  wallet2: string,
  fingerprint: string
): Promise<{ match: boolean }> {
  const supabase = createClient()
  
  const { data } = await supabase
    .from('anti_sybil_flags')
    .select('wallet_address')
    .contains('flags', [{ type: 'device_fingerprint', value: fingerprint }])
    .limit(10)
  
  const wallets = data?.map(d => d.wallet_address) || []
  
  // If both wallets share the same device fingerprint
  if (wallets.includes(wallet1) && wallets.includes(wallet2)) {
    return { match: true }
  }
  
  // If more than 3 wallets share same fingerprint
  if (wallets.length >= 3) {
    return { match: true }
  }
  
  return { match: false }
}

/**
 * Check if wallets have suspicious submission timing patterns
 */
async function checkSubmissionTiming(
  wallet1: string,
  wallet2: string
): Promise<{ suspicious: boolean; reason?: string }> {
  const supabase = createClient()
  
  // Get users for these wallets
  const { data: users } = await supabase
    .from('users')
    .select('id, wallet_address, created_at')
    .in('wallet_address', [wallet1, wallet2])
  
  if (!users || users.length !== 2) {
    return { suspicious: false }
  }
  
  // Check if registered within 5 minutes of each other
  const [user1, user2] = users
  const timeDiff = Math.abs(
    new Date(user1.created_at).getTime() - new Date(user2.created_at).getTime()
  )
  
  if (timeDiff < 5 * 60 * 1000) {
    // Check if they submitted findings to same protocol within 1 hour
    const { data: findings } = await supabase
      .from('findings')
      .select('researcher_id, protocol_id, created_at')
      .in('researcher_id', [user1.id, user2.id])
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (findings && findings.length >= 2) {
      // Group by protocol
      const protocols = new Map<string, Date[]>()
      
      for (const f of findings) {
        if (!protocols.has(f.protocol_id)) {
          protocols.set(f.protocol_id, [])
        }
        protocols.get(f.protocol_id)!.push(new Date(f.created_at))
      }
      
      // Check if submitted to same protocol within 1 hour
      for (const [_, timestamps] of protocols) {
        if (timestamps.length >= 2) {
          const diff = Math.abs(timestamps[0].getTime() - timestamps[1].getTime())
          if (diff < 60 * 60 * 1000) {
            return { 
              suspicious: true, 
              reason: 'Registered and submitted to same protocol within short timeframe' 
            }
          }
        }
      }
    }
  }
  
  return { suspicious: false }
}

/**
 * Check if wallets are already in a known Sybil cluster
 */
async function getExistingCluster(
  wallet1: string,
  wallet2: string
): Promise<{ found: boolean; cluster_id?: string }> {
  const supabase = createClient()
  
  const { data: clusters } = await supabase
    .from('anti_sybil_flags')
    .select('cluster_id')
    .in('wallet_address', [wallet1, wallet2])
    .not('cluster_id', 'is', null)
  
  if (!clusters || clusters.length === 0) {
    return { found: false }
  }
  
  // If both wallets in same cluster
  const clusterIds = clusters.map(c => c.cluster_id)
  const uniqueClusters = new Set(clusterIds)
  
  if (uniqueClusters.size === 1) {
    return { found: true, cluster_id: clusters[0].cluster_id! }
  }
  
  return { found: false }
}

/**
 * Flag a wallet as part of a Sybil cluster
 */
export async function flagWalletAsSybil(
  wallet: string,
  flags: Array<{ type: string; value: any }>,
  riskScore: number,
  clusterId?: string
): Promise<void> {
  const supabase = createClient()
  
  await supabase
    .from('anti_sybil_flags')
    .upsert({
      wallet_address: wallet.toLowerCase(),
      risk_score: riskScore,
      flags: flags as any,
      cluster_id: clusterId || `cluster-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      reviewed: false,
    })
}

/**
 * Comprehensive Sybil check for a wallet
 */
export async function checkWalletSybilRisk(
  wallet: string,
  context?: {
    ip_address?: string
    user_agent?: string
    device_fingerprint?: string
  }
): Promise<SybilCheckResult> {
  const supabase = createClient()
  const w = wallet.toLowerCase()
  
  // Check if already flagged
  const { data: existingFlag } = await supabase
    .from('anti_sybil_flags')
    .select('risk_score, flags, cluster_id')
    .eq('wallet_address', w)
    .single()
  
  if (existingFlag && existingFlag.risk_score >= 0.6) {
    return {
      is_sybil: true,
      risk_score: existingFlag.risk_score,
      flags: (existingFlag.flags as any[])?.map(f => f.type) || [],
      cluster_id: existingFlag.cluster_id || undefined,
    }
  }
  
  // Perform new checks
  const flags: string[] = []
  let riskScore = existingFlag?.risk_score || 0
  
  // Check IP clustering
  if (context?.ip_address) {
    const ipCheck = await checkIPClustering(w, w, context.ip_address)
    if (ipCheck.clustered) {
      flags.push('ip_cluster')
      riskScore += 0.3
    }
  }
  
  // Check for spam submissions
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('wallet_address', w)
    .single()
  
  if (userData) {
    const { count: rejectedCount } = await supabase
      .from('findings')
      .select('id', { count: 'exact', head: true })
      .eq('researcher_id', userData.id)
      .eq('status', 'rejected')
    
    const { count: totalCount } = await supabase
      .from('findings')
      .select('id', { count: 'exact', head: true })
      .eq('researcher_id', userData.id)
    
    if (totalCount && totalCount > 5) {
      const rejectionRate = (rejectedCount || 0) / totalCount
      if (rejectionRate > 0.7) {
        flags.push('high_rejection_rate')
        riskScore += 0.4
      }
    }
  }
  
  riskScore = Math.min(riskScore, 1.0)
  
  return {
    is_sybil: riskScore >= 0.6,
    risk_score: riskScore,
    flags,
    cluster_id: existingFlag?.cluster_id || undefined,
  }
}
