/**
 * Rate Limiting for Anti-Sybil
 * Prevents spam and coordinated attacks
 */

import { createClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export interface RateLimitConfig {
  max_requests: number
  window_seconds: number
  identifier_type: 'wallet' | 'ip' | 'api_key'
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  reset_at: Date
  retry_after_seconds?: number
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Registration: 5 per IP per hour
  'registration_ip': {
    max_requests: 5,
    window_seconds: 3600,
    identifier_type: 'ip',
  },
  
  // Submission: 10 per wallet per day
  'submission_wallet': {
    max_requests: 10,
    window_seconds: 86400,
    identifier_type: 'wallet',
  },
  
  // Submission: 20 per IP per day (prevents IP-based farming)
  'submission_ip': {
    max_requests: 20,
    window_seconds: 86400,
    identifier_type: 'ip',
  },
  
  // API reads: 100 per API key per hour
  'api_read': {
    max_requests: 100,
    window_seconds: 3600,
    identifier_type: 'api_key',
  },
}

/**
 * Check rate limit for a given action
 */
export async function checkRateLimit(
  action: keyof typeof RATE_LIMITS,
  identifier: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action]
  if (!config) {
    throw new Error(`Unknown rate limit action: ${action}`)
  }
  
  const supabase = createClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.window_seconds * 1000)
  
  const bucket_key = `${action}:${identifier}`
  
  // Get current count in window
  const { data: bucket } = await supabase
    .from('rate_limit_buckets')
    .select('count, reset_at')
    .eq('bucket_key', bucket_key)
    .gte('reset_at', now.toISOString())
    .single()
  
  if (!bucket) {
    // No bucket exists or expired - create new one
    const resetAt = new Date(now.getTime() + config.window_seconds * 1000)
    
    await supabase
      .from('rate_limit_buckets')
      .upsert({
        bucket_key,
        count: 1,
        reset_at: resetAt.toISOString(),
        window_seconds: config.window_seconds,
      })
    
    return {
      allowed: true,
      remaining: config.max_requests - 1,
      reset_at: resetAt,
    }
  }
  
  // Bucket exists - check if limit exceeded
  if (bucket.count >= config.max_requests) {
    const resetAt = new Date(bucket.reset_at)
    const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000)
    
    return {
      allowed: false,
      remaining: 0,
      reset_at: resetAt,
      retry_after_seconds: retryAfter,
    }
  }
  
  // Increment counter
  await supabase
    .from('rate_limit_buckets')
    .update({ count: bucket.count + 1 })
    .eq('bucket_key', bucket_key)
  
  return {
    allowed: true,
    remaining: config.max_requests - (bucket.count + 1),
    reset_at: new Date(bucket.reset_at),
  }
}

/**
 * Middleware: Check rate limit and return 429 if exceeded
 */
export async function rateLimitMiddleware(
  req: NextRequest,
  action: keyof typeof RATE_LIMITS,
  getIdentifier: (req: NextRequest) => string | null
): Promise<NextResponse | null> {
  const identifier = getIdentifier(req)
  
  if (!identifier) {
    // No identifier = can't rate limit, allow through
    return null
  }
  
  const result = await checkRateLimit(action, identifier)
  
  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retry_after_seconds: result.retry_after_seconds,
        reset_at: result.reset_at.toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMITS[action].max_requests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.floor(result.reset_at.getTime() / 1000).toString(),
          'Retry-After': (result.retry_after_seconds || 0).toString(),
        },
      }
    )
  }
  
  // Add rate limit headers to successful responses
  req.headers.set('X-RateLimit-Limit', RATE_LIMITS[action].max_requests.toString())
  req.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  req.headers.set('X-RateLimit-Reset', Math.floor(result.reset_at.getTime() / 1000).toString())
  
  return null // Allow request through
}

/**
 * Extract IP address from request
 */
export function getRequestIP(req: NextRequest): string | null {
  // Try various headers (Vercel, Cloudflare, etc.)
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  // Fallback
  return req.headers.get('x-vercel-forwarded-for') || null
}

/**
 * Extract wallet address from request
 */
export function getRequestWallet(req: NextRequest): string | null {
  return req.headers.get('x-wallet-address')?.toLowerCase() || null
}

/**
 * Extract API key from request
 */
export function getRequestApiKey(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7)
  }
  return null
}

/**
 * Cleanup expired rate limit buckets
 * Should be run periodically (cron job)
 */
export async function cleanupExpiredBuckets(): Promise<{ deleted: number }> {
  const supabase = createClient()
  
  const { count } = await supabase
    .from('rate_limit_buckets')
    .delete()
    .lt('reset_at', new Date().toISOString())
  
  return { deleted: count || 0 }
}

/**
 * Per-protocol cooldown check
 * Prevents spamming same protocol repeatedly
 */
export async function checkProtocolCooldown(
  wallet: string,
  protocolSlug: string,
  cooldownHours: number = 24
): Promise<{ allowed: boolean; last_submission?: Date; retry_after_seconds?: number }> {
  const supabase = createClient()
  
  // Get user ID for wallet
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('wallet_address', wallet.toLowerCase())
    .single()
  
  if (!userData) {
    return { allowed: true }
  }
  
  // Get protocol ID
  const { data: protocol } = await supabase
    .from('protocols')
    .select('id')
    .eq('slug', protocolSlug)
    .single()
  
  if (!protocol) {
    return { allowed: true }
  }
  
  const cooldownDate = new Date(Date.now() - cooldownHours * 3600000).toISOString()
  
  // Check for recent submission to this protocol
  const { data: recentSubmission } = await supabase
    .from('findings')
    .select('created_at')
    .eq('researcher_id', userData.id)
    .eq('protocol_id', protocol.id)
    .gte('created_at', cooldownDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (!recentSubmission) {
    return { allowed: true }
  }
  
  const lastSubmission = new Date(recentSubmission.created_at)
  const nextAllowed = new Date(lastSubmission.getTime() + cooldownHours * 3600000)
  const now = new Date()
  
  if (now >= nextAllowed) {
    return { allowed: true, last_submission: lastSubmission }
  }
  
  const retryAfter = Math.ceil((nextAllowed.getTime() - now.getTime()) / 1000)
  
  return {
    allowed: false,
    last_submission: lastSubmission,
    retry_after_seconds: retryAfter,
  }
}
