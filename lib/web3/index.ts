/**
 * WhiteClaws Web3 Module
 * Re-exports all web3-related utilities
 */

// Config
export { SUPPORTED_CHAINS, CONTRACTS } from './config';
export type { SupportedChain, ContractName } from './config';

// Client
export {
  config,
  getWalletClient,
  switchChain,
  connectWallet,
  disconnectWallet,
  readContract,
  writeContract,
} from './client';
export type { Chain, WalletClient } from './client';

// Hooks
export { useWhiteClaws, useAccessStatus, useTokenBalance } from './hooks';
export type { WhiteClawsState, AccessStatusState } from './hooks';
