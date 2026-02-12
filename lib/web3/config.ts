/**
 * Web3 Configuration — chain and contract addresses.
 * Contracts will be deployed to Base (Phase 4B).
 */

export const SUPPORTED_CHAINS = [
  { id: 8453, name: 'Base', symbol: 'ETH', rpc: 'https://mainnet.base.org' },
  { id: 1, name: 'Ethereum', symbol: 'ETH', rpc: 'https://eth.llamarpc.com' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH', rpc: 'https://arb1.arbitrum.io/rpc' },
  { id: 10, name: 'Optimism', symbol: 'ETH', rpc: 'https://mainnet.optimism.io' },
] as const

export const PRIMARY_CHAIN = SUPPORTED_CHAINS[0] // Base

export const CONTRACTS = {
  // Phase 4B: Deploy and update these addresses
  accessSBT: null as string | null,  // Soulbound Access Token on Base
  wcToken: null as string | null,    // WhiteClaws $WC token on Base
  airdropClaim: null as string | null, // Merkle proof claim contract on Base
  // Known addresses
  usdcToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as string, // Base USDC
} as const

// SBT mint price in USDC (6 decimals) = $20
export const MINT_PRICE_USDC = '20000000'
export const MINT_PRICE_DISPLAY = '20.00'

export type SupportedChain = typeof SUPPORTED_CHAINS[number]
export type ContractName = keyof typeof CONTRACTS

/**
 * Check if contracts are deployed and configured.
 */
export function hasContracts(): boolean {
  return !!CONTRACTS.accessSBT && !!CONTRACTS.wcToken
}

export function hasSBTContract(): boolean {
  return !!CONTRACTS.accessSBT
}

export function hasClaimContract(): boolean {
  return !!CONTRACTS.airdropClaim
}
