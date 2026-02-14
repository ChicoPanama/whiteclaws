import 'server-only'

import { createClient as createAdminClient } from '@/lib/supabase/admin'

export type RateLimitConfig = {
  key: string
  limit: number
  windowSeconds: number
}

export async function checkRateLimit(config: RateLimitConfig): Promise<{ ok: true } | { ok: false }> {
  try {
    const supabase = createAdminClient()
    // Supabase types won't know about this RPC until database.types.ts is regenerated.
    const { data, error } = await (supabase as any).rpc('rate_limit_check', {
      p_key: config.key,
      p_limit: config.limit,
      p_window_seconds: config.windowSeconds,
    })
    if (error) return { ok: false }
    return data === true ? { ok: true } : { ok: false }
  } catch {
    // Fail open to avoid hard outages if the limiter migration hasn't been applied yet.
    return { ok: true }
  }
}
