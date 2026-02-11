/**
 * API Key Management — generate, hash, and verify agent API keys.
 *
 * Key format: wc_live_<32 random hex chars>
 * Storage:    Only the SHA-256 hash is stored in Supabase.
 *             The prefix (first 8 chars) is stored for fast lookup.
 *
 * Flow:
 *   1. Agent registers → generateApiKey() → return raw key ONCE
 *   2. Agent calls API → extractApiKey(req) → verifyApiKey(key) → user record
 */

import { createHash, randomBytes } from 'crypto'

const KEY_PREFIX = 'wc_live_'

/**
 * Generate a new API key. Returns { raw, hash, prefix }.
 * The raw key is shown to the user ONCE and never stored.
 */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const secret = randomBytes(32).toString('hex')
  const raw = `${KEY_PREFIX}${secret}`
  const hash = hashKey(raw)
  const prefix = raw.slice(0, KEY_PREFIX.length + 8) // wc_live_<8 chars>

  return { raw, hash, prefix }
}

/**
 * SHA-256 hash of a raw API key.
 */
export function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

/**
 * Extract API key from request headers.
 * Supports: Authorization: Bearer wc_live_xxx
 *           X-API-Key: wc_live_xxx
 */
export function extractApiKey(req: Request): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer wc_live_')) {
    return auth.slice(7) // Remove "Bearer "
  }

  const xKey = req.headers.get('x-api-key')
  if (xKey?.startsWith('wc_live_')) {
    return xKey
  }

  return null
}

/**
 * Validate key format without DB lookup.
 */
export function isValidKeyFormat(key: string): boolean {
  return key.startsWith(KEY_PREFIX) && key.length === KEY_PREFIX.length + 64
}
