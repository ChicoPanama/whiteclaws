/**
 * Access Control — Supabase-backed access checks.
 * Phase 4B will add on-chain SBT verification.
 */

export interface AccessStatus {
  address: string
  hasAccess: boolean
  isValidated: boolean
  expiry: string | null
}

export interface AccessMintResponse {
  ok: boolean
  error?: string
  txHash?: string
}

/**
 * Check if an address has platform access.
 * Currently checks via API → Supabase.
 * Phase 4B will also verify on-chain SBT ownership.
 */
export async function getAccessStatus(address: string): Promise<AccessStatus> {
  try {
    const response = await fetch(`/api/access/status?address=${address}`, { cache: 'no-store' })
    if (response.ok) {
      return response.json()
    }
  } catch {
    // API unavailable
  }

  // Open beta: default to access granted for connected wallets
  return {
    address,
    hasAccess: true,
    isValidated: false,
    expiry: null,
  }
}

/**
 * Request access mint (SBT).
 * Currently records access grant in Supabase.
 * Phase 4B will trigger on-chain SBT mint on Base.
 */
export async function mintAccess(address: string): Promise<AccessMintResponse> {
  try {
    const response = await fetch('/api/access/mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    })

    if (response.ok) {
      return response.json()
    }

    const err = await response.json().catch(() => ({}))
    return { ok: false, error: err.error || 'Mint request failed' }
  } catch {
    return { ok: false, error: 'Network error' }
  }
}
