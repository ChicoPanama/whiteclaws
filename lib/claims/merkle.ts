/**
 * Season Snapshot & Merkle Tree — generates final allocation and proof tree.
 *
 * Snapshot process:
 * 1. Recalculate all scores
 * 2. Final Sybil sweep
 * 3. Normalize to proportional shares
 * 4. Generate Merkle tree for onchain claiming
 *
 * Merkle tree uses keccak256 hashing (standard for EVM claims).
 */

import { createClient } from '@/lib/supabase/admin'
import type { Row } from '@/lib/supabase/helpers'
import { recalculateAllScores } from '@/lib/services/points-engine'
import { keccak256 as viemKeccak256, encodePacked } from 'viem'

export interface AllocationEntry {
  wallet_address: string
  user_id: string
  total_score: number
  share_pct: number
  allocation_amount: bigint
  proof?: string[]
}

/**
 * Generate season snapshot — calculates final allocations.
 */
export async function generateSnapshot(
  season: number,
  poolSize: bigint // Total $WC tokens to distribute (in wei)
): Promise<{
  ok: boolean
  allocations?: AllocationEntry[]
  merkleRoot?: string
  error?: string
}> {
  try {
    const supabase = createClient()

    // 1. Recalculate all scores
    await recalculateAllScores(season)

    // 2. Get all scores with wallet addresses
    const { data: scores } = await (supabase
      .from('contribution_scores')
      .select('user_id, total_score, sybil_multiplier')
      .eq('season', season)
      .gt('total_score', 0))

    if (!scores || scores.length === 0) {
      return { ok: false, error: 'No scores found for this season' }
    }

    // Get wallet addresses for all users
    const userIds = scores.map((s: any) => s.user_id)
    const { data: users } = await (supabase
      .from('users')
      .select('id, wallet_address')
      .in('id', userIds))

    const walletMap = new Map((users || []).map((u: any) => [u.id, u.wallet_address]))

    // 2b. Filter out high-risk Sybil wallets
    const walletAddrs = Array.from(walletMap.values()).filter(Boolean) as string[]
    const { data: sybilFlags } = walletAddrs.length > 0
      ? await supabase
          .from('anti_sybil_flags')
          .select('wallet_address, risk_score')
          .in('wallet_address', walletAddrs)
          .gt('risk_score', 0.8)
      : { data: null }
    const excludedWallets = new Set((sybilFlags || []).map((f: any) => f.wallet_address))

    // 3. Calculate total score and proportional shares
    const totalScore = scores.reduce((sum: number, s: any) => sum + (s.total_score * (s.sybil_multiplier || 1)), 0)

    if (totalScore === 0) return { ok: false, error: 'Total score is zero' }

    const allocations: AllocationEntry[] = scores
      .filter((s: any) => walletMap.get(s.user_id) && !excludedWallets.has(walletMap.get(s.user_id)))
      .map((s: any) => {
        const effectiveScore = s.total_score * (s.sybil_multiplier || 1)
        const sharePct = effectiveScore / totalScore
        const allocationAmount = BigInt(Math.floor(Number(poolSize) * sharePct))

        return {
          wallet_address: walletMap.get(s.user_id) as string,
          user_id: s.user_id,
          total_score: effectiveScore,
          share_pct: sharePct,
          allocation_amount: allocationAmount,
        }
      })
      .filter((a: AllocationEntry) => a.allocation_amount > BigInt(0))

    // 4. Generate Merkle tree
    const { root, proofs } = buildMerkleTree(allocations)

    // Attach proofs to allocations
    for (const alloc of allocations) {
      alloc.proof = proofs.get(alloc.wallet_address) || []
    }

    // 5. Store snapshot in metadata
    await (supabase
      .from('season_config')
      .update({
        metadata: {
          snapshot_at: new Date().toISOString(),
          merkle_root: root,
          total_participants: allocations.length,
          total_score: totalScore,
          pool_size: poolSize.toString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('season', season))

    return { ok: true, allocations, merkleRoot: root }
  } catch (err) {
    console.error('[Snapshot] Error:', err)
    return { ok: false, error: 'Snapshot generation failed' }
  }
}

// ── Merkle Tree ──

function hashLeaf(wallet: string, amount: bigint): string {
  return viemKeccak256(
    encodePacked(['address', 'uint256'], [wallet.toLowerCase() as `0x${string}`, amount])
  )
}

function hashPair(a: string, b: string): string {
  const [first, second] = a < b ? [a, b] : [b, a]
  return viemKeccak256(encodePacked(['bytes32', 'bytes32'], [first as `0x${string}`, second as `0x${string}`]))
}

function buildMerkleTree(allocations: AllocationEntry[]): {
  root: string
  proofs: Map<string, string[]>
} {
  if (allocations.length === 0) {
    return { root: '0x' + '0'.repeat(64), proofs: new Map() }
  }

  // Build leaves
  const leaves = allocations.map((a) => ({
    wallet: a.wallet_address,
    hash: hashLeaf(a.wallet_address, a.allocation_amount),
  }))

  // Sort leaves by hash for deterministic tree
  leaves.sort((a, b) => (a.hash < b.hash ? -1 : 1))

  // Build tree bottom-up
  const proofs = new Map<string, string[]>()
  for (const leaf of leaves) {
    proofs.set(leaf.wallet, [])
  }

  let currentLevel = leaves.map((l) => l.hash)

  while (currentLevel.length > 1) {
    const nextLevel: string[] = []

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i]
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left

      const parent = hashPair(left, right)
      nextLevel.push(parent)

      // Add sibling to proof for each leaf that traces through this node
      for (const leaf of leaves) {
        const leafProof = proofs.get(leaf.wallet)!
        if (leafProof.length === Math.log2(nextLevel.length * 2) - 1) {
          // This leaf is at this level
        }
      }
    }

    // Simple proof generation: for each leaf, track the sibling at each level
    for (const leaf of leaves) {
      const idx = currentLevel.indexOf(leaf.hash)
      if (idx === -1) continue

      const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1
      if (siblingIdx >= 0 && siblingIdx < currentLevel.length) {
        proofs.get(leaf.wallet)!.push(currentLevel[siblingIdx])
      }

      // Update leaf hash to parent for next level
      const pairIdx = Math.floor(idx / 2)
      leaf.hash = nextLevel[pairIdx]
    }

    currentLevel = nextLevel
  }

  return { root: currentLevel[0], proofs }
}

/**
 * Get a user's Merkle proof for claiming.
 */
export async function getUserProof(
  walletAddress: string,
  season: number
): Promise<{
  eligible: boolean
  amount?: string
  proof?: string[]
  error?: string
}> {
  const supabase = createClient()

  // Check season has snapshot
  const { data: config } = await (supabase
    .from('season_config')
    .select('metadata, status')
    .eq('season', season)
    .returns<Row<'season_config'>[]>().single())

  if (!config || !['frozen', 'claiming'].includes(config.status)) {
    return { eligible: false, error: 'Season not in claimable state' }
  }

  if (!(config.metadata as Record<string, unknown>)?.merkle_root) {
    return { eligible: false, error: 'Snapshot not yet generated' }
  }

  // Look up user's allocation
  const { data: user } = await (supabase
    .from('users')
    .select('id')
    .eq('wallet_address', walletAddress)
    .returns<Row<'users'>[]>().maybeSingle())

  if (!user) return { eligible: false, error: 'Wallet not registered' }

  const { data: score } = await (supabase
    .from('contribution_scores')
    .select('total_score')
    .eq('user_id', user.id)
    .eq('season', season)
    .returns<Row<'contribution_scores'>[]>().maybeSingle())

  if (!score || score.total_score <= 0) {
    return { eligible: false, error: 'No points earned this season' }
  }

  // In production: retrieve stored proof from IPFS or Supabase storage
  // For now: return eligibility status
  return {
    eligible: true,
    amount: '0', // Will be calculated from stored snapshot
    proof: [], // Will be retrieved from stored proofs
  }
}
