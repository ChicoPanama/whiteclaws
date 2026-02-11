/**
 * Supabase Admin Client — uses service role key for server-side operations.
 * This bypasses RLS policies. Only use in API routes, never in client code.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let adminClient: ReturnType<typeof createSupabaseClient> | null = null

export function createAdminClient() {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for admin operations')
  }

  adminClient = createSupabaseClient(url, key, {
    auth: { persistSession: false },
  })

  return adminClient
}
