/**
 * Points Engine — records participation events and enforces rules.
 *
 * Every scorable action flows through recordEvent().
 * Rules: SBT gate, cooldown enforcement, weekly cap, event validation.
 * Non-blocking: never throws — returns { ok, reason? } so parent routes don't fail.
 */

import { createClient } from '@/lib/supabase/admin'

// ── Event Types ──

export const EVENT_TYPES = {
  // Tier 1 — Security
  finding_submitted: { tier: 'security', points: 50, cooldown: null },
  finding_accepted: { tier: 'security', points: 500, cooldown: null },
  finding_paid: { tier: 'security', points: 1000, cooldown: null },
  encrypted_report: { tier: 'security', points: 25, cooldown: null },
  critical_finding: { tier: 'security', points: 2000, cooldown: null },
  poc_provided: { tier: 'security', points: 50, cooldown: null },

  // Tier 2 — Growth
  protocol_registered: { tier: 'growth', points: 200, cooldown: 'one-time' },
  bounty_created: { tier: 'growth', points: 300, cooldown: 'one-time' },
  bounty_funded: { tier: 'growth', points: 500, cooldown: null },
  scope_published: { tier: 'growth', points: 100, cooldown: null },

  // Tier 3 — Engagement
  sbt_minted: { tier: 'engagement', points: 100, cooldown: 'one-time' },
  sbt_minted_early: { tier: 'engagement', points: 200, cooldown: 'one-time' },
  agent_registered: { tier: 'engagement', points: 25, cooldown: 'one-time' },
  weekly_active: { tier: 'engagement', points: 10, cooldown: 'weekly' },
  weekly_submission: { tier: 'engagement', points: 25, cooldown: 'weekly' },
  streak_bonus: { tier: 'engagement', points: 100, cooldown: null },
  heartbeat_active: { tier: 'engagement', points: 5, cooldown: 'weekly' },

  // Tier 4 — Social
  x_claimed: { tier: 'social', points: 50, cooldown: 'one-time' },
  x_share_finding: { tier: 'social', points: 15, cooldown: null },
} as const

export type EventType = keyof typeof EVENT_TYPES

// ── Season/Week Helpers ──

const SEASON_1_START = new Date('2026-03-01T00:00:00Z') // Placeholder — updated from season_config

export function getSeasonWeek(): { season: number; week: number } {
  const now = new Date()
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeksSinceStart = Math.max(1, Math.ceil((now.getTime() - SEASON_1_START.getTime()) / msPerWeek))
  return { season: 1, week: weeksSinceStart }
}

// ── Core Functions ──

export interface RecordResult {
  ok: boolean
  eventId?: string
  points?: number
  reason?: string
}

/**
 * Record a participation event. This is the single entry point for all point accrual.
 * Non-blocking: always returns a result, never throws.
 */
export async function recordEvent(
  userId: string,
  eventType: EventType,
  metadata: Record<string, any> = {}
): Promise<RecordResult> {
  try {
    const eventConfig = EVENT_TYPES[eventType]
    if (!eventConfig) return { ok: false, reason: 'unknown_event_type' }

    const supabase = createClient()

    // Gate 1: SBT required
    const hasSbt = await requireSBT(userId)
    if (!hasSbt) return { ok: false, reason: 'no_sbt' }

    // Gate 2: Cooldown check
    const { season, week } = getSeasonWeek()
    const cooldownOk = await checkCooldown(userId, eventType, season, week, metadata)
    if (!cooldownOk) return { ok: false, reason: 'cooldown_active' }

    // Gate 3: Weekly cap
    const capOk = await checkWeeklyCap(userId, season, week)
    if (!capOk) return { ok: false, reason: 'weekly_cap_reached' }

    // Get wallet address
    const { data: user } = await (supabase
      .from('users')
      .select('wallet_address')
      .eq('id', userId)
      .single())

    const walletAddress = user?.wallet_address || null

    // Record the event
    const { data: event, error } = await (supabase
      .from('participation_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        points: eventConfig.points,
        metadata,
        wallet_address: walletAddress,
        verified: true,
        season,
        week,
      })
      .select('id')
      .single())

    if (error) {
      console.error('[Points] Event insert error:', error)
      return { ok: false, reason: 'db_error' }
    }

    return { ok: true, eventId: event?.id, points: eventConfig.points }
  } catch (err) {
    console.error('[Points] recordEvent error:', err)
    return { ok: false, reason: 'internal_error' }
  }
}

/**
 * Check if user has minted the Access SBT.
 */
export async function requireSBT(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data } = await (supabase
      .from('access_sbt')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle())
    return !!data
  } catch {
    return false
  }
}

/**
 * Check cooldown rules for an event type.
 */
async function checkCooldown(
  userId: string,
  eventType: EventType,
  season: number,
  week: number,
  metadata: Record<string, any>
): Promise<boolean> {
  const config = EVENT_TYPES[eventType]
  if (!config.cooldown) return true // No cooldown

  const supabase = createClient()

  if (config.cooldown === 'one-time') {
    // Check if this event has ever been recorded for this user
    const { data } = await (supabase
      .from('participation_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', eventType)
      .limit(1))
    return !data || data.length === 0
  }

  if (config.cooldown === 'weekly') {
    // Check if already recorded this week
    const { data } = await (supabase
      .from('participation_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', eventType)
      .eq('season', season)
      .eq('week', week)
      .limit(1))
    return !data || data.length === 0
  }

  return true
}

/**
 * Check if user has hit the weekly point cap.
 */
async function checkWeeklyCap(
  userId: string,
  season: number,
  week: number
): Promise<boolean> {
  try {
    const supabase = createClient()

    // Get weekly cap from season_config
    const { data: config } = await (supabase
      .from('season_config')
      .select('weekly_cap')
      .eq('season', season)
      .single())

    const cap = config?.weekly_cap || 5000

    // Sum points this week
    const { data: events } = await (supabase
      .from('participation_events')
      .select('points')
      .eq('user_id', userId)
      .eq('season', season)
      .eq('week', week))

    const totalThisWeek = (events || []).reduce((sum: number, e: any) => sum + (e.points || 0), 0)
    return totalThisWeek < cap
  } catch {
    return true // Allow on error (don't block)
  }
}
