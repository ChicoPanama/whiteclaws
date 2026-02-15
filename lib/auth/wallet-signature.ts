/**
 * Wallet Signature Authentication — Moltbook-style stateless auth.
 *
 * Agent signs a message with their ETH private key.
 * Server verifies with ecrecover — no API keys, no sessions.
 *
 * Headers:
 *   X-Wallet-Address:   0x1234...abcd
 *   X-Wallet-Signature: 0xsignature...
 *   X-Wallet-Timestamp: 1707600000
 *   X-Wallet-Nonce:     random-uuid (optional, for replay protection)
 *
 * Message format: "whiteclaws:{method}:{path}:{timestamp}:{nonce?}"
 * Timestamp window: ±5 minutes to prevent replay attacks.
 * Nonce: Prevents signature reuse within timestamp window.
 */

import { verifyMessage } from 'viem'
import { createClient } from '@/lib/supabase/admin'

const TIMESTAMP_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const NONCE_EXPIRY_SECONDS = 600 // 10 minutes

export interface WalletAuth {
  address: string
  timestamp: number
}

/**
 * Construct the message that the agent should sign.
 */
export function constructSignMessage(
  method: string, 
  path: string, 
  timestamp: number,
  nonce?: string
): string {
  const base = `whiteclaws:${method.toUpperCase()}:${path}:${timestamp}`
  return nonce ? `${base}:${nonce}` : base
}

/**
 * Extract and verify wallet signature from request headers.
 * Returns the verified wallet address or null.
 */
export async function verifyWalletSignature(req: Request): Promise<WalletAuth | null> {
  const address = req.headers.get('x-wallet-address')
  const signature = req.headers.get('x-wallet-signature')
  const timestampStr = req.headers.get('x-wallet-timestamp')
  const nonce = req.headers.get('x-wallet-nonce') // Optional

  if (!address || !signature || !timestampStr) return null

  // Validate timestamp window
  const timestamp = parseInt(timestampStr, 10)
  if (isNaN(timestamp)) return null

  const now = Math.floor(Date.now() / 1000)
  const diff = Math.abs(now - timestamp)
  if (diff * 1000 > TIMESTAMP_WINDOW_MS) return null

  // Check nonce for replay protection (if provided)
  if (nonce) {
    const nonceUsed = await checkAndMarkNonce(address.toLowerCase(), nonce)
    if (nonceUsed) {
      console.warn(`[WalletAuth] Replay attempt detected: ${address} reused nonce ${nonce}`)
      return null
    }
  }

  // Extract method and path from request
  const url = new URL(req.url)
  const method = (req).method || 'GET'
  const message = constructSignMessage(method, url.pathname, timestamp, nonce)

  try {
    // Verify the signature using viem's ecrecover
    const valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })

    if (!valid) return null

    return { address: address.toLowerCase(), timestamp }
  } catch {
    return null
  }
}

/**
 * Check if nonce was already used, then mark it as used.
 * Returns true if nonce was already used (replay attack).
 */
async function checkAndMarkNonce(wallet: string, nonce: string): Promise<boolean> {
  const supabase = createClient()
  
  // Try to insert nonce
  const { error } = await supabase
    .from('wallet_signature_nonces')
    .insert({
      wallet_address: wallet.toLowerCase(),
      nonce,
      expires_at: new Date(Date.now() + NONCE_EXPIRY_SECONDS * 1000).toISOString(),
    })
  
  // If unique constraint violation, nonce was already used
  if (error?.code === '23505') {
    return true // Replay detected
  }
  
  // Clean up expired nonces periodically (1% chance per request)
  if (Math.random() < 0.01) {
    await supabase
      .from('wallet_signature_nonces')
      .delete()
      .lt('expires_at', new Date().toISOString())
  }
  
  return false // Fresh nonce
}

/**
 * Check if request has wallet signature headers.
 */
export function hasWalletSignatureHeaders(req: Request): boolean {
  return !!(
    req.headers.get('x-wallet-address') &&
    req.headers.get('x-wallet-signature') &&
    req.headers.get('x-wallet-timestamp')
  )
}
