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
 *
 * Message format: "whiteclaws:{method}:{path}:{timestamp}"
 * Timestamp window: ±5 minutes to prevent replay attacks.
 */

import { verifyMessage } from 'viem'

const TIMESTAMP_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

export interface WalletAuth {
  address: string
  timestamp: number
}

/**
 * Construct the message that the agent should sign.
 */
export function constructSignMessage(method: string, path: string, timestamp: number): string {
  return `whiteclaws:${method.toUpperCase()}:${path}:${timestamp}`
}

/**
 * Extract and verify wallet signature from request headers.
 * Returns the verified wallet address or null.
 */
export async function verifyWalletSignature(req: Request): Promise<WalletAuth | null> {
  const address = req.headers.get('x-wallet-address')
  const signature = req.headers.get('x-wallet-signature')
  const timestampStr = req.headers.get('x-wallet-timestamp')

  if (!address || !signature || !timestampStr) return null

  // Validate timestamp window
  const timestamp = parseInt(timestampStr, 10)
  if (isNaN(timestamp)) return null

  const now = Math.floor(Date.now() / 1000)
  const diff = Math.abs(now - timestamp)
  if (diff * 1000 > TIMESTAMP_WINDOW_MS) return null

  // Extract method and path from request
  const url = new URL(req.url)
  const method = (req).method || 'GET'
  const message = constructSignMessage(method, url.pathname, timestamp)

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
 * Check if request has wallet signature headers.
 */
export function hasWalletSignatureHeaders(req: Request): boolean {
  return !!(
    req.headers.get('x-wallet-address') &&
    req.headers.get('x-wallet-signature') &&
    req.headers.get('x-wallet-timestamp')
  )
}
