/**
 * Onchain Clustering — Layer 4 Sybil resistance.
 *
 * Groups wallets funded from the same source EOA.
 * Transaction graph community detection for Sybil cluster identification.
 *
 * Designed as a batch job — runs periodically, not per-request.
 */

import { createClient } from '@/lib/supabase/admin'
import type { Row } from '@/lib/supabase/helpers'
import { PRIMARY_CHAIN } from '@/lib/web3/config'

/**
 * Check if two wallets share a common funding source.
 * Uses Etherscan/Basescan API when available, falls back to RPC trace.
 */
export async function checkFundingSource(walletAddress: string): Promise<{
  fundingSource: string | null
  flag?: string
}> {
  // In production: use Etherscan API to get first incoming tx
  // For now: placeholder that returns null (no known funding source)
  // This will be enhanced with Etherscan/Basescan API key
  return { fundingSource: null }
}

/**
 * Run clustering analysis on all registered wallets.
 * Groups wallets by common funding source into clusters.
 */
export async function runClusteringBatch(): Promise<{
  clustersFound: number
  walletsProcessed: number
}> {
  const supabase = createClient()

  // Get all registered wallets
  const { data: wallets } = await (supabase
    .from('access_sbt')
    .select('wallet_address')
    .eq('status', 'active'))

  if (!wallets || wallets.length === 0) return { clustersFound: 0, walletsProcessed: 0 }

  // Group by funding source
  const fundingGroups = new Map<string, string[]>()

  for (const w of wallets) {
    const { fundingSource } = await checkFundingSource(w.wallet_address)
    if (fundingSource) {
      const group = fundingGroups.get(fundingSource) || []
      group.push(w.wallet_address)
      fundingGroups.set(fundingSource, group)
    }
  }

  // Flag clusters (3+ wallets from same source)
  let clustersFound = 0
  for (const [source, addresses] of Array.from(fundingGroups.entries())) {
    if (addresses.length >= 3) {
      clustersFound++
      const clusterId = `cluster_${source.slice(0, 10)}_${Date.now()}`

      for (const addr of addresses) {
        await updateClusterFlag(addr, clusterId, addresses.length)
      }
    }
  }

  return { clustersFound, walletsProcessed: wallets.length }
}

/**
 * Flag a wallet as part of a cluster.
 */
async function updateClusterFlag(
  walletAddress: string,
  clusterId: string,
  clusterSize: number
): Promise<void> {
  const supabase = createClient()

  const riskIncrease = clusterSize >= 10 ? 0.5 : clusterSize >= 5 ? 0.35 : 0.2

  const { data: existing } = await (supabase
    .from('anti_sybil_flags')
    .select('risk_score, flags')
    .eq('wallet_address', walletAddress)
    .returns<Row<'anti_sybil_flags'>[]>().maybeSingle())

  const currentFlags = (Array.isArray(existing?.flags) ? existing.flags : []) as string[]
  const newFlags = [...currentFlags, `cluster_${clusterSize}_wallets`]
  const newScore = Math.min((existing?.risk_score || 0) + riskIncrease, 1.0)

  if (existing) {
    await (supabase
      .from('anti_sybil_flags')
      .update({
        risk_score: newScore,
        flags: newFlags,
        cluster_id: clusterId,
        updated_at: new Date().toISOString(),
      })
      .eq('wallet_address', walletAddress))
  } else {
    await (supabase.from('anti_sybil_flags').insert({
      wallet_address: walletAddress,
      risk_score: newScore,
      flags: newFlags,
      cluster_id: clusterId,
    }))
  }
}

/**
 * Get sybil multiplier for a wallet based on risk score.
 */
export function getSybilMultiplier(riskScore: number): number {
  if (riskScore >= 0.8) return 0.0
  if (riskScore >= 0.5) return 0.25
  if (riskScore >= 0.2) return 0.75
  return 1.0
}
