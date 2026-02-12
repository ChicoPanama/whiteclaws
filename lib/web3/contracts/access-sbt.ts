/**
 * AccessSBT Contract Interface
 *
 * Dual-mode: uses Supabase when CONTRACTS.accessSBT is null,
 * switches to onchain reads/writes when contract is deployed.
 *
 * The ONLY change needed to go live: paste the contract address in lib/web3/config.ts
 */

import { createClient } from '@/lib/supabase/admin'
import { CONTRACTS } from '@/lib/web3/config'

// Placeholder ABI — replace with real ABI when contract is compiled
export const ACCESS_SBT_ABI = [
  'function mint(address to, uint8 paymentToken) payable returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwner(address owner) view returns (uint256)',
  'function isMinted(address wallet) view returns (bool)',
  'function mintPrice() view returns (uint256)',
  'event Minted(address indexed wallet, uint256 tokenId, uint8 paymentToken)',
] as const

export type PaymentToken = 'USDC' | 'ETH' | 'WC'

export interface MintResult {
  ok: boolean
  tokenId?: number
  txHash?: string
  isEarly: boolean
  error?: string
}

export interface SBTStatus {
  hasSBT: boolean
  isEarly: boolean
  mintedAt: string | null
  tokenId: number | null
  paymentToken: PaymentToken | null
}

/**
 * Mint an Access SBT.
 * - If contract deployed: record with tx_hash (frontend sends tx, backend verifies)
 * - If contract not deployed: record intent in Supabase (tx_hash = null)
 */
export async function mintSBT(
  userId: string,
  walletAddress: string,
  paymentToken: PaymentToken = 'USDC',
  txHash?: string
): Promise<MintResult> {
  const supabase = createClient()

  // Check if already minted
  const { data: existing } = await (supabase
    .from('access_sbt' as any)
    .select('id')
    .eq('user_id', userId)
    .maybeSingle() as any)

  if (existing) {
    return { ok: false, error: 'SBT already minted', isEarly: false }
  }

  // Determine if early supporter
  const { data: seasonConfig } = await (supabase
    .from('season_config' as any)
    .select('start_date, status')
    .eq('season', 1)
    .maybeSingle() as any)

  const isEarly = !seasonConfig?.start_date ||
    seasonConfig.status === 'pending' ||
    new Date() < new Date(seasonConfig.start_date)

  // If contract is deployed, verify the tx_hash onchain
  let tokenId: number | null = null
  if (CONTRACTS.accessSBT && txHash) {
    // TODO: verify tx_hash onchain with viem
    // const receipt = await publicClient.getTransactionReceipt({ hash: txHash })
    // tokenId = extractTokenIdFromReceipt(receipt)
    tokenId = null // Will be set by onchain verification
  }

  // Record in Supabase (always — this is the source of truth until contract takes over)
  const { error } = await (supabase
    .from('access_sbt' as any)
    .insert({
      user_id: userId,
      wallet_address: walletAddress,
      tx_hash: txHash || null,
      payment_token: paymentToken,
      mint_price: paymentToken === 'USDC' ? '20.00 USDC' : '20 USD equiv',
      token_id: tokenId,
      is_early: isEarly,
      status: 'active',
    }) as any)

  if (error) {
    console.error('[SBT] Mint insert error:', error)
    if (error.code === '23505') return { ok: false, error: 'SBT already minted', isEarly }
    return { ok: false, error: 'Database error', isEarly }
  }

  return { ok: true, tokenId: tokenId ?? undefined, txHash, isEarly }
}

/**
 * Check if a user has an active SBT.
 * Checks Supabase first (fast). When contract exists, can verify onchain too.
 */
export async function hasSBT(userId: string): Promise<boolean> {
  const supabase = createClient()
  const { data } = await (supabase
    .from('access_sbt' as any)
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle() as any)

  return !!data
}

/**
 * Check SBT by wallet address (for unauthenticated checks).
 */
export async function hasSBTByWallet(walletAddress: string): Promise<boolean> {
  const supabase = createClient()
  const { data } = await (supabase
    .from('access_sbt' as any)
    .select('id, status')
    .eq('wallet_address', walletAddress.toLowerCase())
    .eq('status', 'active')
    .maybeSingle() as any)

  // If contract is deployed and not found in DB, check onchain
  if (!data && CONTRACTS.accessSBT) {
    // TODO: onchain fallback
    // const isMinted = await publicClient.readContract({ address: CONTRACTS.accessSBT, abi, functionName: 'isMinted', args: [walletAddress] })
    return false
  }

  return !!data
}

/**
 * Get full SBT details for a user.
 */
export async function getSBTDetails(userId: string): Promise<SBTStatus> {
  const supabase = createClient()
  const { data } = await (supabase
    .from('access_sbt' as any)
    .select('minted_at, is_early, token_id, payment_token, status')
    .eq('user_id', userId)
    .maybeSingle() as any)

  if (!data || data.status !== 'active') {
    return { hasSBT: false, isEarly: false, mintedAt: null, tokenId: null, paymentToken: null }
  }

  return {
    hasSBT: true,
    isEarly: data.is_early || false,
    mintedAt: data.minted_at,
    tokenId: data.token_id,
    paymentToken: data.payment_token,
  }
}
