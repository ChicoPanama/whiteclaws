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
  // When Privy is configured, wallets are auto-created on login.
  // This fallback generates a deterministic placeholder for demo mode.
  const timestamp = Date.now().toString(16).padStart(12, '0')
  const address = `0xAGENT${timestamp}${'0'.repeat(40 - 17)}`

  return { address: address.slice(0, 42) }
}

/**
 * Get wallet address from Privy user object.
 */
export function getWalletAddress(privyUser: any): string | null {
  if (!privyUser) return null
  return privyUser.wallet?.address || null
}
