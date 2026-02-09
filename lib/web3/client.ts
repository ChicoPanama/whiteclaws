/**
 * Web3 Client Scaffold
 * Stub implementation for Wagmi/Viem client
 * Does not block if packages are missing
 */

// Placeholder types for when wagmi/viem aren't installed
export type Chain = {
  id: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
};

export type WalletClient = {
  account: { address: string } | null;
  chain: Chain | null;
};

// Stub client configuration
export const config = {
  chains: [] as Chain[],
  client: null as WalletClient | null,
};

// Placeholder connection functions
export async function getWalletClient(): Promise<WalletClient | null> {
  // TODO: Implement with wagmi/viem when packages available
  return null;
}

export async function switchChain(chainId: number): Promise<boolean> {
  // TODO: Implement chain switching
  console.log(`[STUB] Switch chain to ${chainId}`);
  return false;
}

export async function connectWallet(): Promise<{ address: string; chainId: number } | null> {
  // TODO: Implement wallet connection
  console.log('[STUB] Connect wallet');
  return null;
}

export async function disconnectWallet(): Promise<void> {
  // TODO: Implement wallet disconnection
  console.log('[STUB] Disconnect wallet');
}

// Contract read/write stubs
export async function readContract<T = unknown>(
  address: string,
  abi: unknown[],
  functionName: string,
  args?: unknown[]
): Promise<T | null> {
  // TODO: Implement contract reads
  console.log(`[STUB] Read contract ${functionName} at ${address}`);
  return null;
}

export async function writeContract(
  address: string,
  abi: unknown[],
  functionName: string,
  args?: unknown[],
  value?: bigint
): Promise<string | null> {
  // TODO: Implement contract writes
  console.log(`[STUB] Write contract ${functionName} at ${address}`);
  return null;
}
