/**
 * Agent Authentication Middleware — validates API keys via api_keys table.
 * Consolidated: all auth goes through lib/auth/api-key.ts
 *
 * Usage in API routes:
 *   const agent = await authenticateAgent(req)
 *   if (!agent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 */

import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import type { Row } from '@/lib/supabase/helpers'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export interface AuthenticatedAgent {
  id: string
  handle: string
  display_name: string | null
  is_agent: boolean
  reputation_score: number
  status: string
  scopes?: string[]
}

/**
 * Authenticate an agent from request headers.
 * Returns agent record if valid, null otherwise.
 */
export async function authenticateAgent(req: Request): Promise<AuthenticatedAgent | null> {
  const rawKey = extractApiKey(req)
  if (!rawKey) return null

  const auth = await verifyApiKey(rawKey)
  if (!auth.valid || !auth.userId) return null

  try {
    const supabase = createAdminClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, handle, display_name, is_agent, reputation_score, status')
      .eq('id', auth.userId)
      .returns<Row<'users'>[]>().single()

    if (error || !user) return null
    if (user.status !== 'active') return null

    return {
      id: user.id,
      handle: user.handle ?? '',
      display_name: user.display_name,
      is_agent: user.is_agent,
      reputation_score: user.reputation_score ?? 0,
      status: user.status,
      scopes: auth.scopes,
    }
  } catch {
    return null
  }
}
