/**
 * Referral Engine — code generation, qualification, bonus calculation, anti-gaming.
 *
 * Single-level only (no pyramid). Referrer earns % of referred user's Tier 1+2 points.
 * Referral only qualifies when referred user completes a meaningful action.
 */

import { createClient } from '@/lib/supabase/admin'
import type { Row } from '@/lib/supabase/helpers'
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
    .from('access_sbt')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .returns<Row<'access_sbt'>[]>().maybeSingle())

  if (!sbt) return { ok: false, error: 'SBT required to generate referral code' }

  // Check existing
  const { data: existing } = await (supabase
    .from('referral_links')
    .select('code')
    .eq('referrer_id', userId)
    .returns<Row<'referral_links'>[]>().maybeSingle())

  if (existing) return { ok: true, code: existing.code }

  // Get wallet
  const { data: user } = await (supabase
    .from('users')
    .select('wallet_address')
    .eq('id', userId)
    .returns<Row<'users'>[]>().single())

  if (!user?.wallet_address) return { ok: false, error: 'No wallet address found' }

  // Generate unique code with retry
  let code: string = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateCode()
    const { data: collision } = await (supabase
      .from('referral_links')
      .select('id')
      .eq('code', code)
      .returns<Row<'referral_links'>[]>().maybeSingle())
    if (!collision) break
    if (attempt === 4) return { ok: false, error: 'Failed to generate unique code' }
  }

  const { error } = await (supabase
    .from('referral_links')
    .insert({
      referrer_id: userId,
      code,
      wallet_address: user.wallet_address,
    }))

  if (error) {
    if (error.code === '23505') {
      // Race condition — fetch existing
      const { data: raceExisting } = await (supabase
        .from('referral_links')
        .select('code')
        .eq('referrer_id', userId)
        .returns<Row<'referral_links'>[]>().single())
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
    .from('referral_links')
    .select('referrer_id, wallet_address')
    .eq('code', code)
    .returns<Row<'referral_links'>[]>().single())

  if (!link) return { ok: false, error: 'Invalid referral code' }

  // Anti-gaming: self-referral check
  if (link.referrer_id === referredUserId) {
    return { ok: false, error: 'Cannot use own referral code' }
  }

  // Anti-gaming: same wallet check
  const { data: referredUser } = await (supabase
    .from('users')
    .select('wallet_address')
    .eq('id', referredUserId)
    .returns<Row<'users'>[]>().maybeSingle())

  if (referredUser?.wallet_address && link.wallet_address === referredUser.wallet_address) {
    return { ok: false, error: 'Self-referral detected (same wallet)' }
  }

  // Anti-gaming: circular referral check
  const { data: reverse } = await (supabase
    .from('referral_rewards')
    .select('id')
    .eq('referrer_id', referredUserId)
    .eq('referred_id', link.referrer_id)
    .returns<Row<'referral_rewards'>[]>().maybeSingle())

  if (reverse) return { ok: false, error: 'Circular referral blocked' }

  // Create pending reward
  const { error } = await (supabase
    .from('referral_rewards')
    .insert({
      referrer_id: link.referrer_id,
      referred_id: referredUserId,
      season: 1,
      status: 'pending',
    }))

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Referral already applied' }
    return { ok: false, error: 'Failed to apply referral' }
  }

  // Increment total_referred
  try {
    await supabase
      .from('referral_links')
      .update({ total_referred: (link.total_referred || 0) + 1 })
      .eq('referrer_id', link.referrer_id)
  } catch {
    // Best-effort increment
  }

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
    .from('referral_rewards')
    .select('id, referrer_id, status')
    .eq('referred_id', referredUserId)
    .eq('status', 'pending')
    .returns<Row<'referral_rewards'>[]>().maybeSingle())

  if (!reward) return // No pending referral

  // Calculate bonus (10% of referred user's Tier 1+2 points this season)
  const { data: events } = await (supabase
    .from('participation_events')
    .select('points, event_type')
    .eq('user_id', referredUserId)
    .eq('season', 1))

  const tier12Points = (events || [])
    .filter((e: any) => {
      const tier = getTier(e.event_type)
      return tier === 'security' || tier === 'growth'
    })
    .reduce((sum: number, e: any) => sum + (e.points || 0), 0)

  const bonus = Math.floor(tier12Points * 0.10) // 10% of Tier 1+2

  // Update reward
  await (supabase
    .from('referral_rewards')
    .update({
      qualifying_action: qualifyingAction,
      qualified_at: new Date().toISOString(),
      referrer_bonus: Math.max(bonus, 50), // Minimum 50 points
      status: 'qualified',
    })
    .eq('id', reward.id))

  // Increment qualified count
  const { data: currentLink } = await supabase
    .from('referral_links')
    .select('qualified_referred')
    .eq('referrer_id', reward.referrer_id)
    .returns<Row<'referral_links'>[]>().single()
  if (currentLink) {
    await supabase
      .from('referral_links')
      .update({ qualified_referred: (currentLink.qualified_referred || 0) + 1 })
      .eq('referrer_id', reward.referrer_id)
  }

  // Fire referral bonus event for the referrer
  fireEvent(reward.referrer_id, 'referral_qualified', {
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
    .from('referral_links')
    .select('code, total_referred, qualified_referred')
    .eq('referrer_id', userId)
    .returns<Row<'referral_links'>[]>().maybeSingle())

  const { data: rewards } = await (supabase
    .from('referral_rewards')
    .select('referred_id, status, referrer_bonus, qualified_at')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
    .limit(20))

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
    referral_qualified: 'growth',
    heartbeat_active: 'engagement',
    x_claimed: 'social',
    x_share_finding: 'social',
  }
  return tierMap[eventType] || 'engagement'
}
