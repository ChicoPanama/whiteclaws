/**
 * Unified Identity Resolver — single entry point for all auth methods.
 *
 * Tries in order:
 *   1. API Key (Authorization: Bearer wc_xxx or X-API-Key: wc_xxx)
 *   2. Wallet Signature (X-Wallet-Address + X-Wallet-Signature + X-Wallet-Timestamp)
 *   3. SIWE Token (reserved for future session tokens)
 *
 * Every method resolves to the same Identity interface.
 */

import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { verifyWalletSignature, hasWalletSignatureHeaders } from '@/lib/auth/wallet-signature'
import { resolveWalletUser } from '@/lib/auth/siwe'
import { createClient } from '@/lib/supabase/admin'

export interface Identity {
  userId: string
  handle: string
  address?: string
  method: 'api_key' | 'wallet_signature' | 'siwe'
  scopes?: string[]
}

/**
 * Resolve identity from any supported auth method.
 * Returns null for unauthenticated requests.
 */
export async function resolveIdentity(req: Request): Promise<Identity | null> {
  // Method 1: API Key — most common, backward compatible
  const apiKey = extractApiKey(req)
  if (apiKey) {
    const auth = await verifyApiKey(apiKey)
    if (auth.valid && auth.userId) {
      const supabase = createClient()
      const { data: user } = await (supabase
        .from('users')
        .select('handle, wallet_address')
        .eq('id', auth.userId)
        .single() as any)

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
          scopes: ['agent:read', 'agent:submit'],
        }
      }
    }
  }

  return null
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
