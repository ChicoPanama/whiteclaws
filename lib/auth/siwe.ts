/**
 * SIWE (Sign-In with Ethereum) — EIP-4361 authentication.
 *
 * Flow:
 *   1. Agent → POST /api/auth/challenge → { message, nonce }
 *   2. Agent signs message with personal_sign (EIP-191)
 *   3. Agent → POST /api/auth/verify → { address, token }
 *
 * The nonce prevents replay attacks. Nonces expire after 5 minutes.
 * Uses viem for signature verification (same as wallet-signature.ts).
 */

import { verifyMessage } from 'viem'
import { createClient } from '@/lib/supabase/admin'

const NONCE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes
const DOMAIN = 'whiteclaws-dun.vercel.app'
const URI = `https://${DOMAIN}`

// In-memory nonce store (Supabase-backed for production persistence)
// Format: Map<nonce, { address?: string, createdAt: number, used: boolean }>
const nonceStore = new Map<string, { createdAt: number; used: boolean }>()

/**
 * Generate a cryptographically random nonce.
 */
function generateNonce(): string {
  const buf = new Uint8Array(16)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Clean up expired nonces periodically.
 */
function cleanupNonces() {
  const now = Date.now()
  for (const [nonce, data] of nonceStore) {
    if (now - data.createdAt > NONCE_EXPIRY_MS * 2) {
      nonceStore.delete(nonce)
    }
  }
}

/**
 * Create a SIWE challenge message.
 * Returns the EIP-4361 formatted message and nonce.
 */
export function createChallenge(address?: string): { message: string; nonce: string } {
  cleanupNonces()

  const nonce = generateNonce()
  const issuedAt = new Date().toISOString()
  const expirationTime = new Date(Date.now() + NONCE_EXPIRY_MS).toISOString()

  nonceStore.set(nonce, { createdAt: Date.now(), used: false })

  // EIP-4361 message format
  const message = [
    `${DOMAIN} wants you to sign in with your Ethereum account:`,
    address || '{{ADDRESS}}',
    '',
    'Sign in to WhiteClaws — decentralized bug bounty platform.',
    '',
    `URI: ${URI}`,
    'Version: 1',
    `Chain ID: 8453`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${expirationTime}`,
  ].join('\n')

  return { message, nonce }
}

/**
 * Verify a signed SIWE message.
 * Returns the verified address or null.
 */
export async function verifyChallenge(
  message: string,
  signature: string
): Promise<{ address: string; nonce: string } | null> {
  // Extract nonce from message
  const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/)
  if (!nonceMatch) return null
  const nonce = nonceMatch[1]

  // Check nonce validity
  const nonceData = nonceStore.get(nonce)
  if (!nonceData) return null
  if (nonceData.used) return null
  if (Date.now() - nonceData.createdAt > NONCE_EXPIRY_MS) {
    nonceStore.delete(nonce)
    return null
  }

  // Extract address from message
  const addressMatch = message.match(/0x[a-fA-F0-9]{40}/)
  if (!addressMatch) return null
  const claimedAddress = addressMatch[0]

  try {
    const valid = await verifyMessage({
      address: claimedAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })

    if (!valid) return null

    // Mark nonce as used
    nonceData.used = true

    return { address: claimedAddress.toLowerCase(), nonce }
  } catch {
    return null
  }
}

/**
 * Resolve a wallet address to a user ID in the database.
 * Creates a new user record if the address isn't registered.
 */
export async function resolveWalletUser(address: string): Promise<{
  userId: string
  handle: string
  isNew: boolean
} | null> {
  const supabase = createClient()
  const normalizedAddress = address.toLowerCase()

  // Check existing user
  const { data: existing } = await supabase
    .from('users')
    .select('id, handle')
    .eq('wallet_address', normalizedAddress)
    .maybeSingle()

  if (existing) {
    return { userId: existing.id, handle: existing.handle, isNew: false }
  }

  // Also check payout_wallet
  const { data: byPayout } = await supabase
    .from('users')
    .select('id, handle')
    .eq('payout_wallet', normalizedAddress)
    .maybeSingle()

  if (byPayout) {
    return { userId: byPayout.id, handle: byPayout.handle, isNew: false }
  }

  return null // User not found — they need to register first
}
