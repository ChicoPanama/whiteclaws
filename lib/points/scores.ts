/**
 * Score Calculation Service — aggregates participation_events into contribution_scores.
 *
 * Designed to run as a cron job or on-demand after events are recorded.
 * Applies tier weights, sybil multipliers, and ranking.
 */

import { createClient } from '@/lib/supabase/admin'
import { EVENT_TYPES, type EventType } from '@/lib/points/engine'

// Tier weights — security dominates
const TIER_WEIGHTS = {
  security: 0.50,
  growth: 0.25,
  engagement: 0.15,
  social: 0.10,
}

/**
 * Recalculate a single user's contribution score for a season.
 */
export async function recalculateUserScore(userId: string, season: number = 1): Promise<void> {
  const supabase = createClient()

  // Sum points by tier
  const { data: events } = await (supabase
    .from('participation_events' as any)
    .select('event_type, points')
    .eq('user_id', userId)
    .eq('season', season) as any)

  if (!events || events.length === 0) return

  const tierSums = { security: 0, growth: 0, engagement: 0, social: 0 }

  for (const event of events) {
    const config = EVENT_TYPES[event.event_type as EventType]
    if (config) {
      tierSums[config.tier as keyof typeof tierSums] += event.points || 0
    }
  }

  // Get sybil multiplier
  const { data: user } = await (supabase
    .from('users' as any)
    .select('wallet_address')
    .eq('id', userId)
    .single() as any)

  let sybilMultiplier = 1.0
  if (user?.wallet_address) {
    const { data: sybilFlag } = await (supabase
      .from('anti_sybil_flags' as any)
      .select('risk_score')
      .eq('wallet_address', user.wallet_address)
      .maybeSingle() as any)

    if (sybilFlag) {
      const risk = sybilFlag.risk_score || 0
      if (risk >= 0.8) sybilMultiplier = 0.0
      else if (risk >= 0.5) sybilMultiplier = 0.25
      else if (risk >= 0.2) sybilMultiplier = 0.75
      else sybilMultiplier = 1.0
    }
  }

  // Calculate weighted total
  const totalScore =
    (TIER_WEIGHTS.security * tierSums.security +
      TIER_WEIGHTS.growth * tierSums.growth +
      TIER_WEIGHTS.engagement * tierSums.engagement +
      TIER_WEIGHTS.social * tierSums.social) *
    sybilMultiplier

  // Upsert contribution score
  await (supabase.from('contribution_scores' as any).upsert(
    {
      user_id: userId,
      season,
      security_points: tierSums.security,
      growth_points: tierSums.growth,
      engagement_points: tierSums.engagement,
      social_points: tierSums.social,
      total_score: totalScore,
      sybil_multiplier: sybilMultiplier,
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,season' }
  ) as any)
}

/**
 * Recalculate all user scores for a season.
 */
export async function recalculateAllScores(season: number = 1): Promise<number> {
  const supabase = createClient()

  // Get all users with events this season
  const { data: userIds } = await (supabase
    .from('participation_events' as any)
    .select('user_id')
    .eq('season', season) as any)

  if (!userIds) return 0

  const uniqueUserIds = Array.from(new Set(userIds.map((r: any) => r.user_id)))

  for (const userId of uniqueUserIds) {
    await recalculateUserScore(userId, season)
  }

  // Update ranks
  await updateRanks(season)

  return uniqueUserIds.length
}

/**
 * Assign ranks based on total_score descending.
 */
export async function updateRanks(season: number = 1): Promise<void> {
  const supabase = createClient()

  const { data: scores } = await (supabase
    .from('contribution_scores' as any)
    .select('id, total_score')
    .eq('season', season)
    .order('total_score', { ascending: false }) as any)

  if (!scores) return

  for (let i = 0; i < scores.length; i++) {
    await (supabase
      .from('contribution_scores' as any)
      .update({ rank: i + 1 })
      .eq('id', scores[i].id) as any)
  }
}

/**
 * Apply score decay for inactive users.
 * Decay rates based on weeks of inactivity.
 */
export async function applyDecay(season: number = 1): Promise<number> {
  const supabase = createClient()

  const { data: scores } = await (supabase
    .from('contribution_scores' as any)
    .select('id, user_id, last_active_at, total_score')
    .eq('season', season)
    .gt('total_score', 0) as any)

  if (!scores) return 0

  let decayed = 0
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000

  for (const score of scores) {
    if (!score.last_active_at) continue

    const inactiveMs = now - new Date(score.last_active_at).getTime()
    const inactiveWeeks = Math.floor(inactiveMs / weekMs)

    let decayRate = 0
    if (inactiveWeeks >= 9) decayRate = 0.15
    else if (inactiveWeeks >= 5) decayRate = 0.10
    else if (inactiveWeeks >= 3) decayRate = 0.05
    else continue // No decay within grace period

    const newScore = score.total_score * (1 - decayRate)
    await (supabase
      .from('contribution_scores' as any)
      .update({ total_score: newScore, updated_at: new Date().toISOString() })
      .eq('id', score.id) as any)
    decayed++
  }

  return decayed
}
