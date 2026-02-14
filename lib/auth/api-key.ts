/**
 * API Key utilities for agent authentication.
 * Keys are SHA-256 hashed before storage — only the prefix is stored in plaintext.
 * Format: wc_<prefix>_<secret> (e.g. wc_abc123_longrandomsecret...)
 */

import { createClient as createServerClient } from '@/lib/supabase/admin'

const KEY_PREFIX = 'wc'
const PREFIX_LENGTH = 8
const SECRET_LENGTH = 32

/**
 * Generate a cryptographically secure random hex string.
 */
function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Hash a key using SHA-256.
 */
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a new API key for an agent.
 * Returns the full key (only shown once) and the DB record.
 */
export async function generateApiKey(
  userId: string,
  name: string = 'default',
  scopes: string[] = ['agent:read', 'agent:submit']
): Promise<{ key: string; keyPrefix: string; id: string }> {
  const prefix = randomHex(PREFIX_LENGTH / 2)
  const secret = randomHex(SECRET_LENGTH)
  const fullKey = `${KEY_PREFIX}_${prefix}_${secret}`
  const keyHash = await hashKey(fullKey)

  const supabase = createServerClient()

  // Enforce max 10 active keys per user — auto-rotate oldest
  const { count } = await supabase
    .from('api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('revoked_at', null)

  if ((count || 0) >= 10) {
    const { data: oldest } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (oldest) {
      await supabase
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', oldest.id)
    }
  }

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      key_hash: keyHash,
      key_prefix: `${KEY_PREFIX}_${prefix}`,
      name,
      scopes,
    })
    .select('id')
    .single()

  if (error) throw error

  return { key: fullKey, keyPrefix: `${KEY_PREFIX}_${prefix}`, id: data.id }
}

/**
 * Verify an API key and return the associated user.
 * Updates last_used_at on successful verification.
 */
export async function verifyApiKey(key: string): Promise<{
  valid: boolean
  userId?: string
  scopes?: string[]
  error?: string
}> {
  if (!key || !key.startsWith(`${KEY_PREFIX}_`)) {
    return { valid: false, error: 'Invalid key format' }
  }

  const keyHash = await hashKey(key)
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id, scopes, revoked_at, expires_at')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (error) return { valid: false, error: 'Database error' }
  if (!data) return { valid: false, error: 'Invalid API key' }

  if (data.revoked_at) return { valid: false, error: 'API key has been revoked' }
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'API key has expired' }
  }

  // Update last used
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  return { valid: true, userId: data.user_id, scopes: data.scopes }
}

/**
 * Extract API key from request headers.
 * Supports: Authorization: Bearer wc_xxx_yyy
 */
export function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer wc_')) {
    return authHeader.slice(7)
  }

  // Also check X-API-Key header
  const apiKeyHeader = request.headers.get('X-API-Key')
  if (apiKeyHeader?.startsWith('wc_')) {
    return apiKeyHeader
  }

  // Also check httpOnly cookie set by /api/auth/verify
  const cookie = request.headers.get('cookie') || ''
  // Simple parse: look for `wc_agent_api_key=...`
  const match = cookie.match(/(?:^|;\s*)wc_agent_api_key=([^;]+)/)
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1])
    } catch {
      return match[1]
    }
  }

  return null
}

/**
 * Revoke an API key.
 */
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('user_id', userId)

  return !error
}
