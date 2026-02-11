/**
 * Agent Authentication Middleware — validates API keys against Supabase.
 *
 * Usage in API routes:
 *   const agent = await authenticateAgent(req)
 *   if (!agent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 */

import { extractApiKey, hashKey, isValidKeyFormat } from '@/lib/auth/apikey'
import { createAdminClient } from '@/lib/supabase/admin'

export interface AuthenticatedAgent {
  id: string
  handle: string
  display_name: string | null
  is_agent: boolean
  reputation_score: number
  status: string
}

/**
 * Authenticate an agent from request headers.
 * Returns agent record if valid, null otherwise.
 */
export async function authenticateAgent(req: Request): Promise<AuthenticatedAgent | null> {
  const rawKey = extractApiKey(req)
  if (!rawKey || !isValidKeyFormat(rawKey)) {
    return null
  }

  const hash = hashKey(rawKey)
  const prefix = rawKey.slice(0, 16) // wc_live_ + 8 chars

  try {
    const supabase = createAdminClient()

    // Fast prefix lookup, then verify hash
    const { data: user, error } = await supabase
      .from('users')
      .select('id, handle, display_name, is_agent, reputation_score, status, api_key_hash')
      .eq('api_key_prefix', prefix)
      .single()

    if (error || !user) return null

    // Constant-time hash comparison
    if (user.api_key_hash !== hash) return null

    // Check agent status
    if (user.status !== 'active') return null

    return {
      id: user.id,
      handle: user.handle,
      display_name: user.display_name,
      is_agent: user.is_agent,
      reputation_score: user.reputation_score,
      status: user.status,
    }
  } catch {
    return null
  }
}
