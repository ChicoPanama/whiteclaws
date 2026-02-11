/**
 * Supabase Admin Client — uses SUPABASE_SERVICE_ROLE_KEY.
 * ONLY use in server-side API routes, never in client components.
 * Bypasses RLS for administrative operations.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let adminClient: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  adminClient = createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return adminClient
}

// Alias for backward compatibility
export const createAdminClient = createClient
