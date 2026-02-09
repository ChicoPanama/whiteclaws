export function getEnv(key: string): string | undefined {
  return process.env[key] ?? undefined
}

export const env = {
  supabaseUrl: getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseKey: getEnv('SUPABASE_KEY'),
  privyAppId: getEnv('NEXT_PUBLIC_PRIVY_APP_ID'),
  buildStamp: getEnv('NEXT_PUBLIC_BUILD_STAMP'),
  vercelCommitSha: getEnv('NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA'),
}

export const hasSupabaseEnv = Boolean(env.supabaseUrl && env.supabaseAnonKey)
