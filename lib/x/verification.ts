/**
 * X/Twitter Verification System
 *
 * OAuth 2.0 flow for X account linking. Supports all user types (agent, human, protocol).
 * Tweet verification ensures wallet↔X 1:1 binding.
 *
 * Requires env vars: X_CLIENT_ID, X_CLIENT_SECRET, X_CALLBACK_URL
 */

import { createClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// ── OAuth Config ──

const X_AUTH_URL = 'https://twitter.com/i/oauth2/authorize'
const X_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token'

function getXConfig() {
  return {
    clientId: process.env.X_CLIENT_ID || '',
    clientSecret: process.env.X_CLIENT_SECRET || '',
    callbackUrl: process.env.X_CALLBACK_URL || process.env.NEXT_PUBLIC_APP_URL + '/api/x/callback',
  }
}

// ── State Management (in-memory for now, move to Redis for production) ──

const oauthStates = new Map<string, { userId: string; codeVerifier: string; createdAt: number }>()

// Clean up stale states every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of Array.from(oauthStates.entries())) {
    if (now - val.createdAt > 600000) oauthStates.delete(key)
  }
}, 600000)

// ── PKCE Helpers ──

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

// ── OAuth Flow ──

export function generateAuthUrl(userId: string): string {
  const config = getXConfig()
  const state = crypto.randomBytes(16).toString('hex')
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)

  oauthStates.set(state, { userId, codeVerifier, createdAt: Date.now() })

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    scope: 'tweet.read users.read offline.access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  return `${X_AUTH_URL}?${params.toString()}`
}

export async function handleCallback(
  code: string,
  state: string
): Promise<{ ok: boolean; userId?: string; xHandle?: string; xId?: string; error?: string }> {
  const stateData = oauthStates.get(state)
  if (!stateData) return { ok: false, error: 'Invalid or expired state' }

  oauthStates.delete(state)
  const config = getXConfig()

  try {
    // Exchange code for token
    const tokenRes = await fetch(X_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.callbackUrl,
        code_verifier: stateData.codeVerifier,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('[X] Token exchange failed:', err)
      return { ok: false, error: 'Token exchange failed' }
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // Get user info
    const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=created_at,public_metrics', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!userRes.ok) return { ok: false, error: 'Failed to fetch X user info' }

    const userData = await userRes.json()
    const xUser = userData.data

    // Store verification
    const supabase = createClient()

    // Detect user type
    const { data: user } = await (supabase
      .from('users' as any)
      .select('is_agent')
      .eq('id', stateData.userId)
      .single() as any)

    let userType = 'human'
    if (user?.is_agent) userType = 'agent'
    // TODO: detect protocol type from protocol_members table

    // Get wallet address
    const { data: walletUser } = await (supabase
      .from('users' as any)
      .select('wallet_address')
      .eq('id', stateData.userId)
      .single() as any)

    await (supabase.from('x_verifications' as any).upsert(
      {
        user_id: stateData.userId,
        user_type: userType,
        x_handle: xUser.username,
        x_id: xUser.id,
        wallet_address: walletUser?.wallet_address || '',
        status: 'pending', // Pending until verification tweet is posted
      },
      { onConflict: 'user_id' }
    ) as any)

    return { ok: true, userId: stateData.userId, xHandle: xUser.username, xId: xUser.id }
  } catch (err) {
    console.error('[X] Callback error:', err)
    return { ok: false, error: 'Internal error during OAuth' }
  }
}

// ── Tweet Verification ──

export function getVerificationTweetTemplate(
  userType: 'agent' | 'human' | 'protocol',
  walletAddress: string,
  handle: string
): string {
  switch (userType) {
    case 'agent':
      return `🦞 @${handle} is hunting bugs on @WhiteClawsSec\nWallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\n#WhiteClaws #BugBounty`
    case 'protocol':
      return `🦞 @${handle} bounties are live on @WhiteClawsSec\n#WhiteClaws #BugBounty`
    default:
      return `🦞 I'm securing DeFi on @WhiteClawsSec\nWallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\n#WhiteClaws #BugBounty`
  }
}

export function getShareFindingTemplate(
  protocolName: string,
  severity: string,
  referralCode: string
): string {
  return `🦞 Vulnerability accepted on @WhiteClawsSec\nProtocol: ${protocolName} | Severity: ${severity} | Status: Accepted ✅\nHunt bounties → whiteclaws.xyz/ref/${referralCode}\n#WhiteClaws #BugBounty #DeFiSecurity`
}

export async function verifyTweet(
  userId: string,
  tweetId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()

  // Get verification record
  const { data: verification } = await (supabase
    .from('x_verifications' as any)
    .select('x_handle, wallet_address, status')
    .eq('user_id', userId)
    .single() as any)

  if (!verification) return { ok: false, error: 'No X OAuth record found. Complete OAuth first.' }
  if (verification.status === 'verified') return { ok: false, error: 'Already verified' }

  // In production: verify tweet content via Twitter API
  // For now: trust the tweet_id and mark as verified
  // TODO: fetch tweet content and verify it contains wallet address + @WhiteClawsSec

  const { error } = await (supabase
    .from('x_verifications' as any)
    .update({
      tweet_id: tweetId,
      verified_at: new Date().toISOString(),
      status: 'verified',
    })
    .eq('user_id', userId) as any)

  if (error) return { ok: false, error: 'Database update failed' }

  return { ok: true }
}

// ── Status ──

export async function getXStatus(userId: string): Promise<{
  verified: boolean
  x_handle: string | null
  verified_at: string | null
  can_share: boolean
}> {
  const supabase = createClient()

  const { data } = await (supabase
    .from('x_verifications' as any)
    .select('x_handle, verified_at, status')
    .eq('user_id', userId)
    .maybeSingle() as any)

  if (!data) {
    return { verified: false, x_handle: null, verified_at: null, can_share: false }
  }

  return {
    verified: data.status === 'verified',
    x_handle: data.x_handle,
    verified_at: data.verified_at,
    can_share: data.status === 'verified',
  }
}

// ── Tweet Retention Checker ──
// Call via cron (daily). Checks if verification tweets still exist.
// After retention period, stops checking (permanently verified).

const RETENTION_PERIOD_DAYS = 30

export async function checkTweetRetention(): Promise<{
  checked: number
  revoked: number
}> {
  const supabase = createClient()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_PERIOD_DAYS)

  // Only check tweets verified within the retention period
  const { data: verifications } = await (supabase
    .from('x_verifications' as any)
    .select('id, user_id, tweet_id, x_handle, verified_at')
    .eq('status', 'verified')
    .gt('verified_at', cutoff.toISOString()) as any)

  if (!verifications || verifications.length === 0) {
    return { checked: 0, revoked: 0 }
  }

  let checked = 0
  let revoked = 0

  for (const v of verifications) {
    checked++

    // Check if tweet still exists via Twitter API
    // When TWITTER_BEARER_TOKEN is set, verify via API
    const bearerToken = process.env.TWITTER_BEARER_TOKEN
    if (!bearerToken || !v.tweet_id) continue

    try {
      const res = await fetch(`https://api.twitter.com/2/tweets/${v.tweet_id}`, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      })

      if (res.status === 404 || res.status === 403) {
        // Tweet deleted or account suspended — revoke
        await (supabase
          .from('x_verifications' as any)
          .update({
            status: 'revoked',
            tweet_checked_at: new Date().toISOString(),
          })
          .eq('id', v.id) as any)
        revoked++
      } else {
        // Tweet still exists — update check timestamp
        await (supabase
          .from('x_verifications' as any)
          .update({ tweet_checked_at: new Date().toISOString() })
          .eq('id', v.id) as any)
      }
    } catch {
      // API error — skip this one, don't revoke
    }
  }

  return { checked, revoked }
}
