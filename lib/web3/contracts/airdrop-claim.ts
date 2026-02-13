/**
 * Airdrop Claim Contract Interface — Merkle proof-based claiming.
 *
 * When CONTRACTS.airdropClaim is null: functions return stubs.
 * When CONTRACTS.airdropClaim is set: functions make onchain calls.
 *
 * To activate: paste the deployed contract address into lib/web3/config.ts
 */

import { CONTRACTS, hasClaimContract } from '@/lib/web3/config'

// ── ABI Stub ──
// Replace with compiled ABI when contract is deployed
export const CLAIM_ABI = [
  'function claim(uint256 amount, bytes32[] calldata proof) external',
  'function hasClaimed(address account) external view returns (bool)',
  'function merkleRoot() external view returns (bytes32)',
  'function vestingSchedule(address account) external view returns (uint256 total, uint256 claimed, uint256 remaining, uint256 nextUnlock)',
] as const

// ── Contract Functions ──

/**
 * Check if a wallet has already claimed their airdrop.
 */
export async function hasClaimed(walletAddress: string): Promise<boolean> {
  if (!hasClaimContract()) return false

  // When contract is deployed:
  // const result = await readContract({
  //   address: CONTRACTS.airdropClaim as `0x${string}`,
  //   abi: CLAIM_ABI_PARSED,
  //   functionName: 'hasClaimed',
  //   args: [walletAddress],
  // })
  // return result as boolean

  return false
}

/**
 * Get vesting info for a wallet.
 */
export async function getVestingInfo(walletAddress: string): Promise<{
  total: string
  claimed: string
  remaining: string
  nextUnlock: string | null
}> {
  if (!hasClaimContract()) {
    return { total: '0', claimed: '0', remaining: '0', nextUnlock: null }
  }

  // When contract is deployed:
  // const result = await readContract({
  //   address: CONTRACTS.airdropClaim as `0x${string}`,
  //   abi: CLAIM_ABI_PARSED,
  //   functionName: 'vestingSchedule',
  //   args: [walletAddress],
  // })

  return { total: '0', claimed: '0', remaining: '0', nextUnlock: null }
}

/**
 * Get claim status — combines onchain and offchain data.
 */
export async function getClaimStatus(walletAddress: string, season: number = 1): Promise<{
  eligible: boolean
  claimed: boolean
  amount: string
  vesting: {
    total: string
    claimed: string
    remaining: string
    nextUnlock: string | null
  }
  contractDeployed: boolean
}> {
  const contractDeployed = hasClaimContract()
  const claimed = contractDeployed ? await hasClaimed(walletAddress) : false
  const vesting = contractDeployed ? await getVestingInfo(walletAddress) : {
    total: '0', claimed: '0', remaining: '0', nextUnlock: null,
  }

  return {
    eligible: true, // Will be determined by Merkle proof
    claimed,
    amount: '0', // Will be from snapshot
    vesting,
    contractDeployed,
  }
}
