/**
 * Referral Engine — code generation, qualification, bonus calculation, anti-gaming.
 *
 * Single-level only (no pyramid). Referrer earns % of referred user's Tier 1+2 points.
 * Referral only qualifies when referred user completes a meaningful action.
 */

import { createClient } from '@/lib/supabase/admin'
import { fireEvent } from '@/lib/points/hooks'
import crypto from 'crypto'

// ── Code Generation ──

function generateCode(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789' // no confusing chars
  let code = 'wc-'
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(chars.length)]
  }
  return code
}

/**
 * Get or create a referral code for a user. Requires SBT.
 */
export async function getOrCreateReferralCode(userId: string): Promise<{
  ok: boolean
  code?: string
  error?: string
}> {
  const supabase = createClient()

  // Check SBT
  const { data: sbt } = await (supabase
    .from('access_sbt' as any)
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle() as any)

  if (!sbt) return { ok: false, error: 'SBT required to generate referral code' }

  // Check existing
  const { data: existing } = await (supabase
    .from('referral_links' as any)
    .select('code')
    .eq('referrer_id', userId)
    .maybeSingle() as any)

  if (existing) return { ok: true, code: existing.code }

  // Get wallet
  const { data: user } = await (supabase
    .from('users' as any)
    .select('wallet_address')
    .eq('id', userId)
    .single() as any)

  if (!user?.wallet_address) return { ok: false, error: 'No wallet address found' }

  // Generate unique code with retry
  let code: string = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateCode()
    const { data: collision } = await (supabase
      .from('referral_links' as any)
      .select('id')
      .eq('code', code)
      .maybeSingle() as any)
    if (!collision) break
    if (attempt === 4) return { ok: false, error: 'Failed to generate unique code' }
  }

  const { error } = await (supabase
    .from('referral_links' as any)
    .insert({
      referrer_id: userId,
      code,
      wallet_address: user.wallet_address,
    }) as any)

  if (error) {
    if (error.code === '23505') {
      // Race condition — fetch existing
      const { data: raceExisting } = await (supabase
        .from('referral_links' as any)
        .select('code')
        .eq('referrer_id', userId)
        .single() as any)
      return { ok: true, code: raceExisting?.code }
    }
    return { ok: false, error: 'Failed to create referral code' }
  }

  return { ok: true, code }
}

// ── Apply Referral ──

/**
 * Apply a referral code during registration. Creates pending reward.
 */
export async function applyReferralCode(
  referredUserId: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()

  // Find referrer
  const { data: link } = await (supabase
    .from('referral_links' as any)
    .select('referrer_id, wallet_address')
    .eq('code', code)
    .single() as any)

  if (!link) return { ok: false, error: 'Invalid referral code' }

  // Anti-gaming: self-referral check
  if (link.referrer_id === referredUserId) {
    return { ok: false, error: 'Cannot use own referral code' }
  }

  // Anti-gaming: same wallet check
  const { data: referredUser } = await (supabase
    .from('users' as any)
    .select('wallet_address')
    .eq('id', referredUserId)
    .maybeSingle() as any)

  if (referredUser?.wallet_address && link.wallet_address === referredUser.wallet_address) {
    return { ok: false, error: 'Self-referral detected (same wallet)' }
  }

  // Anti-gaming: circular referral check
  const { data: reverse } = await (supabase
    .from('referral_rewards' as any)
    .select('id')
    .eq('referrer_id', referredUserId)
    .eq('referred_id', link.referrer_id)
    .maybeSingle() as any)

  if (reverse) return { ok: false, error: 'Circular referral blocked' }

  // Create pending reward
  const { error } = await (supabase
    .from('referral_rewards' as any)
    .insert({
      referrer_id: link.referrer_id,
      referred_id: referredUserId,
      status: 'pending',
    }) as any)

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Referral already applied' }
    return { ok: false, error: 'Failed to apply referral' }
  }

  // Increment total_referred
  await (supabase.rpc('increment_referral_count' as any, {
    p_referrer_id: link.referrer_id,
  }) as any).catch(() => {
    // Fallback: manual increment if RPC doesn't exist
    supabase
      .from('referral_links' as any)
      .update({ total_referred: (link as any).total_referred + 1 || 1 })
      .eq('referrer_id', link.referrer_id)
  })

  return { ok: true }
}

// ── Qualification Detection ──

/**
 * Check if a referred user has completed a qualifying action.
 * Called from event hooks when relevant events fire.
 */
export async function checkQualification(
  referredUserId: string,
  qualifyingAction: string
): Promise<void> {
  const supabase = createClient()

  // Find pending referral reward
  const { data: reward } = await (supabase
    .from('referral_rewards' as any)
    .select('id, referrer_id, status')
    .eq('referred_id', referredUserId)
    .eq('status', 'pending')
    .maybeSingle() as any)

  if (!reward) return // No pending referral

  // Calculate bonus (10% of referred user's Tier 1+2 points this season)
  const { data: events } = await (supabase
    .from('participation_events' as any)
    .select('points, event_type')
    .eq('user_id', referredUserId)
    .eq('season', 1) as any)

  const tier12Points = (events || [])
    .filter((e: any) => {
      const tier = getTier(e.event_type)
      return tier === 'security' || tier === 'growth'
    })
    .reduce((sum: number, e: any) => sum + (e.points || 0), 0)

  const bonus = Math.floor(tier12Points * 0.10) // 10% of Tier 1+2

  // Update reward
  await (supabase
    .from('referral_rewards' as any)
    .update({
      qualifying_action: qualifyingAction,
      qualified_at: new Date().toISOString(),
      referrer_bonus: Math.max(bonus, 50), // Minimum 50 points
      status: 'qualified',
    })
    .eq('id', reward.id) as any)

  // Increment qualified count
  await (supabase
    .from('referral_links' as any)
    .update({ qualified_referred: (supabase as any).raw?.('qualified_referred + 1') || 1 })
    .eq('referrer_id', reward.referrer_id) as any).catch(() => {})

  // Fire referral bonus event for the referrer
  fireEvent(reward.referrer_id, 'streak_bonus', {
    source: 'referral',
    referred_user: referredUserId,
    bonus,
  })
}

// ── Stats ──

export async function getReferralStats(userId: string): Promise<{
  code: string | null
  total_referred: number
  qualified_referred: number
  bonus_earned: number
  rewards: Array<{ referred_id: string; status: string; bonus: number; qualified_at: string | null }>
}> {
  const supabase = createClient()

  const { data: link } = await (supabase
    .from('referral_links' as any)
    .select('code, total_referred, qualified_referred')
    .eq('referrer_id', userId)
    .maybeSingle() as any)

  const { data: rewards } = await (supabase
    .from('referral_rewards' as any)
    .select('referred_id, status, referrer_bonus, qualified_at')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
    .limit(20) as any)

  const bonusEarned = (rewards || []).reduce((sum: number, r: any) => sum + (r.referrer_bonus || 0), 0)

  return {
    code: link?.code || null,
    total_referred: link?.total_referred || 0,
    qualified_referred: link?.qualified_referred || 0,
    bonus_earned: bonusEarned,
    rewards: (rewards || []).map((r: any) => ({
      referred_id: r.referred_id,
      status: r.status,
      bonus: r.referrer_bonus || 0,
      qualified_at: r.qualified_at,
    })),
  }
}

// ── Anti-Gaming ──

export async function checkWalletClustering(wallet: string): Promise<{
  isSuspicious: boolean
  reason?: string
}> {
  // TODO: Implement funding source analysis via Base RPC
  // For now: basic check — will be enhanced in Phase F
  return { isSuspicious: false }
}

// ── Helpers ──

function getTier(eventType: string): string {
  const tierMap: Record<string, string> = {
    finding_submitted: 'security',
    finding_accepted: 'security',
    finding_paid: 'security',
    encrypted_report: 'security',
    critical_finding: 'security',
    poc_provided: 'security',
    protocol_registered: 'growth',
    bounty_created: 'growth',
    bounty_funded: 'growth',
    scope_published: 'growth',
    sbt_minted: 'engagement',
    sbt_minted_early: 'engagement',
    agent_registered: 'engagement',
    weekly_active: 'engagement',
    weekly_submission: 'engagement',
    streak_bonus: 'engagement',
    heartbeat_active: 'engagement',
    x_claimed: 'social',
    x_share_finding: 'social',
  }
  return tierMap[eventType] || 'engagement'
}
