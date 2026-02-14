/**
 * Agent Wallet Management — uses Privy embedded wallets.
 * Agents get wallets automatically on registration via Privy's
 * createOnLogin: 'users-without-wallets' config.
 */

export interface AgentWallet {
  address: string
}

/**
 * Create an agent wallet. In production this is handled by Privy's
 * embedded wallet system — the wallet is created when the agent
 * authenticates. This function returns the wallet address from
 * the authenticated Privy session.
 *
 * For programmatic agent creation (via API), use the server-side
 * Privy SDK to generate embedded wallets.
 */
export async function createAgentWallet(): Promise<AgentWallet> {
  // Wallet creation is handled by real wallet providers:
  // - Privy embedded wallets (preferred for the current app)
  // - Coinbase Smart Wallet via OnchainKit (Phase 2 foundation)
  //
  // This function previously returned a deterministic fake address, which is
  // unsafe/confusing. Callers should instead read the connected wallet address
  // from their auth/wallet provider and persist it server-side.
  throw new Error('createAgentWallet() is not supported. Connect a wallet (Privy/OnchainKit) and use its address.')
}

/**
 * Get wallet address from Privy user object.
 */
export function getWalletAddress(privyUser: any): string | null {
  if (!privyUser) return null
  return privyUser.wallet?.address || null
}
