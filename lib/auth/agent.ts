/**
 * Agent API Authentication
 * API keys are prefixed with `wc_` and hashed with SHA-256 for storage.
 * Agents authenticate via `Authorization: Bearer wc_xxx` header.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import crypto from 'crypto'

export interface AgentAuth {
  userId: string
  handle: string
  isAgent: boolean
}

/**
 * Generate a new API key and its hash.
 */
export function generateApiKey(): { key: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex')
  const key = `wc_${raw}`
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  return { key, hash }
}

/**
 * Hash an API key for comparison.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Authenticate a request via API key.
 * Returns agent info or null if invalid.
 */
export async function authenticateAgent(req: NextRequest): Promise<AgentAuth | null> {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer wc_')) return null

  const key = auth.replace('Bearer ', '')
  const keyHash = hashApiKey(key)

  const supabase = createClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('id, handle, is_agent')
    .eq('api_key_hash', keyHash)
    .single()

  if (error || !user) return null

  return {
    userId: user.id,
    handle: user.handle,
    isAgent: user.is_agent,
  }
}
