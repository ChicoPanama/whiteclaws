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
  wcToken: null as string | null,    // WhiteClaws utility token on Base
} as const

export type SupportedChain = typeof SUPPORTED_CHAINS[number]
export type ContractName = keyof typeof CONTRACTS

/**
 * Check if contracts are deployed and configured.
 */
export function hasContracts(): boolean {
  return !!CONTRACTS.accessSBT && !!CONTRACTS.wcToken
}
