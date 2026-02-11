/**
 * Unified Identity Resolver — single entry point for all auth methods.
 *
 * Tries in order:
 *   1. API Key (Authorization: Bearer wc_xxx or X-API-Key: wc_xxx)
 *   2. Wallet Signature (X-Wallet-Address + X-Wallet-Signature + X-Wallet-Timestamp)
 *   3. SIWE Token (X-SIWE-Token — reserved for future session tokens)
 *
 * Every method resolves to the same Identity interface.
 * Existing routes keep working — this is additive, not a replacement.
 */

import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { verifyWalletSignature, hasWalletSignatureHeaders } from '@/lib/auth/wallet-signature'
import { resolveWalletUser } from '@/lib/auth/siwe'

export interface Identity {
  userId: string
  handle: string
  address?: string
  method: 'api_key' | 'wallet_signature' | 'siwe'
  scopes?: string[]
}

/**
 * Resolve identity from any supported auth method.
 * Returns null for unauthenticated requests (fine for public endpoints).
 */
export async function resolveIdentity(req: Request): Promise<Identity | null> {
  // Method 1: API Key — most common, backward compatible
  const apiKey = extractApiKey(req)
  if (apiKey) {
    const auth = await verifyApiKey(apiKey)
    if (auth.valid && auth.userId) {
      // Fetch handle for the identity
      const { createClient } = await import('@/lib/supabase/admin')
      const supabase = createClient()
      const { data: user } = await supabase
        .from('users')
        .select('handle, wallet_address')
        .eq('id', auth.userId)
        .single()

      return {
        userId: auth.userId,
        handle: user?.handle || 'unknown',
        address: user?.wallet_address || undefined,
        method: 'api_key',
        scopes: auth.scopes,
      }
    }
  }

  // Method 2: Wallet Signature — stateless, no key storage needed
  if (hasWalletSignatureHeaders(req)) {
    const walletAuth = await verifyWalletSignature(req)
    if (walletAuth) {
      const userInfo = await resolveWalletUser(walletAuth.address)
      if (userInfo) {
        return {
          userId: userInfo.userId,
          handle: userInfo.handle,
          address: walletAuth.address,
          method: 'wallet_signature',
          scopes: ['agent:read', 'agent:submit'], // Default scopes for wallet auth
        }
      }
      // Valid signature but unknown wallet — return partial identity
      // The route can decide what to do (e.g., allow read-only access)
      return null
    }
  }

  return null
}

/**
 * Require authentication — returns Identity or throws 401-compatible error.
 * Use in routes that must be authenticated.
 */
export async function requireIdentity(req: Request): Promise<Identity> {
  const identity = await resolveIdentity(req)
  if (!identity) {
    throw new AuthError('Authentication required. Use API key, wallet signature, or SIWE.', 401)
  }
  return identity
}

/**
 * Check if identity has a required scope.
 */
export function hasScope(identity: Identity, scope: string): boolean {
  if (!identity.scopes) return false
  return identity.scopes.includes(scope)
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number = 401) {
    super(message)
    this.status = status
  }
}
