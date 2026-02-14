/**
 * WhiteClaws Points Engine
 * 
 * Rewards real security contributions.
 * Punishes spam, farming, and sybil behavior.
 * 
 * Scoring philosophy: accepted findings dominate.
 * Submissions alone earn minimal points — this deters false submissions.
 * Rejected findings actively LOSE points.
 */

import { createClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/database.types';

// ── Point values ──
// Tier 1: Security (highest weight)
export const POINTS = {
  // Positive events
  finding_submitted:    5,     // Low — submission alone is not valuable
  finding_accepted:     500,   // High — this is what matters
  finding_paid:         1000,  // Highest — confirmed real value
  critical_finding:     750,   // Bonus on top of accepted
  encrypted_report:     10,    // Bonus — proves sophistication
  poc_provided:         25,    // Bonus — shows real work

  // Tier 2: Growth
  protocol_registered:  100,
  bounty_created:       200,
  scope_published:      50,
  referral_qualified:   75,

  // Tier 3: Engagement
  agent_registered:     5,
  weekly_active:        2,
  weekly_submission:    10,
  streak_bonus_4w:      50,    // 4 consecutive weeks
  streak_bonus_8w:      150,   // 8 consecutive weeks
  streak_bonus_16w:     500,   // 16 consecutive weeks

  // Tier 4: Social
  x_claimed:            5,
  x_share_finding:      2,

  // ── PENALTIES (negative) ──
  finding_rejected:     -25,   // Mild penalty — maybe honest mistake
  finding_duplicate:    -15,   // Slightly less — dupes happen
  spam_submission:      -100,  // Harsh — copy-paste garbage
  rate_limit_penalty:   -50,   // Submitting too fast
  low_quality_report:   -30,   // Automated quality check failed
  sybil_detected:       -500,  // Nuclear — wallet cluster flagged
  farming_pattern:      -200,  // Repetitive low-effort pattern
} as const;

// Tier weights for season scoring
export const TIER_WEIGHTS = {
  security: 0.60,
  growth: 0.20,
  engagement: 0.15,
  social: 0.05,
} as const;

// Weekly cap per wallet (prevents domination)
export const WEEKLY_CAP = 5000;

// ── Season/week helpers ──
const SEASON_START = new Date('2026-02-01T00:00:00Z');
const SEASON_WEEKS = 12;

export function getCurrentSeason(): number {
  const now = new Date();
  const weeksSinceStart = Math.floor((now.getTime() - SEASON_START.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.floor(weeksSinceStart / SEASON_WEEKS) + 1;
}

export function getCurrentWeek(): number {
  const now = new Date();
  const weeksSinceStart = Math.floor((now.getTime() - SEASON_START.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return (weeksSinceStart % SEASON_WEEKS) + 1;
}

// ── Event types by tier ──
const SECURITY_EVENTS = new Set([
  'finding_submitted', 'finding_accepted', 'finding_paid',
  'critical_finding', 'encrypted_report', 'poc_provided',
]);
const GROWTH_EVENTS = new Set([
  'protocol_registered', 'bounty_created', 'scope_published', 'referral_qualified',
]);
const ENGAGEMENT_EVENTS = new Set([
  'agent_registered', 'weekly_active', 'weekly_submission',
  'streak_bonus_4w', 'streak_bonus_8w', 'streak_bonus_16w',
]);
const PENALTY_EVENTS = new Set([
  'finding_rejected', 'finding_duplicate', 'spam_submission',
  'rate_limit_penalty', 'low_quality_report', 'sybil_detected', 'farming_pattern',
]);

function getTier(eventType: string): 'security' | 'growth' | 'engagement' | 'social' | 'penalty' {
  if (PENALTY_EVENTS.has(eventType)) return 'penalty';
  if (SECURITY_EVENTS.has(eventType)) return 'security';
  if (GROWTH_EVENTS.has(eventType)) return 'growth';
  if (ENGAGEMENT_EVENTS.has(eventType)) return 'engagement';
  return 'social';
}

// ── SBT Gate ──
async function requireSBT(userId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('access_sbt')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

// Events that bypass the SBT gate (fire DURING mint/registration)
const SBT_EXEMPT_EVENTS = new Set([
  'sbt_minted',
  'sbt_minted_early',
  'agent_registered',
]);

// ── Cooldown Rules ──
const COOLDOWN_RULES: Record<string, 'one-time' | 'weekly' | null> = {
  sbt_minted: 'one-time',
  sbt_minted_early: 'one-time',
  agent_registered: 'one-time',
  protocol_registered: 'one-time',
  bounty_created: 'one-time',
  x_claimed: 'one-time',
  weekly_active: 'weekly',
  weekly_submission: 'weekly',
  heartbeat_active: 'weekly',
};

async function checkCooldown(
  userId: string,
  eventType: string,
  season: number,
  week: number,
): Promise<boolean> {
  const cooldown = COOLDOWN_RULES[eventType] ?? null;
  if (!cooldown) return true;

  const supabase = createClient();

  if (cooldown === 'one-time') {
    const { data } = await supabase
      .from('participation_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', eventType)
      .limit(1);
    return !data || data.length === 0;
  }

  if (cooldown === 'weekly') {
    const { data } = await supabase
      .from('participation_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', eventType)
      .eq('season', season)
      .eq('week', week)
      .limit(1);
    return !data || data.length === 0;
  }

  return true;
}

// ── Core: Emit a participation event ──
export async function emitParticipationEvent(params: {
  user_id: string;
  event_type: keyof typeof POINTS;
  metadata?: Record<string, unknown>;
  wallet_address?: string;
  finding_id?: string;
}): Promise<{ success: boolean; points: number; event_id?: string; error?: string }> {
  try {
    const supabase = createClient();
    const season = getCurrentSeason();
    const week = getCurrentWeek();
    const points = POINTS[params.event_type] ?? 0;

    // Gate 1: SBT required (unless exempt)
    if (!SBT_EXEMPT_EVENTS.has(params.event_type)) {
      const hasSbt = await requireSBT(params.user_id);
      if (!hasSbt) return { success: false, points: 0, error: 'no_sbt' };
    }

    // Gate 2: Cooldown check
    const cooldownOk = await checkCooldown(params.user_id, params.event_type, season, week);
    if (!cooldownOk) return { success: false, points: 0, error: 'cooldown_active' };

    // Check weekly cap (skip for penalties — those always apply)
    if (points > 0) {
      const { data: weekEvents } = await supabase
        .from('participation_events')
        .select('points')
        .eq('user_id', params.user_id)
        .eq('season', season)
        .eq('week', week)
        .gt('points', 0);

      const weekTotal = (weekEvents || []).reduce((s, e) => s + e.points, 0);
      if (weekTotal >= WEEKLY_CAP) {
        return { success: false, points: 0, error: 'Weekly point cap reached' };
      }
    }

    // Insert event
    const { data, error } = await supabase
      .from('participation_events')
      .insert({
        user_id: params.user_id,
        event_type: params.event_type,
        points,
        metadata: {
          ...params.metadata,
          finding_id: params.finding_id,
        },
        wallet_address: params.wallet_address || null,
        verified: false,
        season,
        week,
      })
      .select('id')
      .single();

    if (error) return { success: false, points: 0, error: error.message };

    // Update contribution scores
    await recalculateScore(params.user_id, season);

    // Referral qualification check (non-blocking)
    const QUALIFYING_EVENTS = new Set([
      'finding_submitted', 'encrypted_report',
      'protocol_registered', 'bounty_created',
    ]);
    if (QUALIFYING_EVENTS.has(params.event_type)) {
      import('@/lib/referral/engine').then(({ checkQualification }) => {
        checkQualification(params.user_id, params.event_type).catch(err => {
          console.error('[Referral] Qualification check failed:', err);
        });
      });
    }

    return { success: true, points, event_id: data.id };
  } catch (err: any) {
    return { success: false, points: 0, error: err.message };
  }
}

// ── Recalculate a user's contribution score for a season ──
export async function recalculateScore(userId: string, season: number): Promise<void> {
  const supabase = createClient();

  const { data: events } = await supabase
    .from('participation_events')
    .select('event_type, points')
    .eq('user_id', userId)
    .eq('season', season);

  if (!events) return;

  let security = 0, growth = 0, engagement = 0, social = 0, penalty = 0;

  for (const e of events) {
    const tier = getTier(e.event_type);
    if (tier === 'security') security += e.points;
    else if (tier === 'growth') growth += e.points;
    else if (tier === 'engagement') engagement += e.points;
    else if (tier === 'social') social += e.points;
    else if (tier === 'penalty') penalty += Math.abs(e.points);
  }

  const totalScore =
    (TIER_WEIGHTS.security * Math.max(0, security)) +
    (TIER_WEIGHTS.growth * Math.max(0, growth)) +
    (TIER_WEIGHTS.engagement * Math.max(0, engagement)) +
    (TIER_WEIGHTS.social * Math.max(0, social)) -
    penalty; // Penalties subtract from total directly

  await supabase
    .from('contribution_scores')
    .upsert({
      user_id: userId,
      season,
      security_points: security,
      growth_points: growth,
      engagement_points: engagement,
      social_points: social,
      penalty_points: penalty,
      total_score: Math.max(0, totalScore), // Floor at 0
      last_active_at: new Date().toISOString(),
    }, { onConflict: 'user_id,season' });
}

// ── Anti-spam: Flag and penalize ──
export async function flagSpam(params: {
  user_id: string;
  flag_type: string;
  finding_id?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createClient();

  // Determine severity based on flag history
  const { count } = await supabase
    .from('spam_flags')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', params.user_id);

  const priorFlags = count || 0;
  const severity = priorFlags >= 5 ? 'ban' : priorFlags >= 2 ? 'strike' : 'warning';

  // Map flag type to penalty
  const penaltyMap: Record<string, keyof typeof POINTS> = {
    rejected_finding: 'finding_rejected',
    duplicate_finding: 'finding_duplicate',
    low_quality: 'low_quality_report',
    rate_limit_hit: 'rate_limit_penalty',
    copy_paste_detected: 'spam_submission',
    sybil_cluster: 'sybil_detected',
    farming_pattern: 'farming_pattern',
  };

  const penaltyEvent = penaltyMap[params.flag_type];
  const pointsDeducted = penaltyEvent ? Math.abs(POINTS[penaltyEvent]) : 0;

  // Record flag
  await supabase.from('spam_flags').insert({
    user_id: params.user_id,
    flag_type: params.flag_type,
    severity,
    points_deducted: pointsDeducted,
    metadata: (params.metadata || {}) as Json,
    finding_id: params.finding_id || null,
  });

  // Emit penalty event
  if (penaltyEvent) {
    await emitParticipationEvent({
      user_id: params.user_id,
      event_type: penaltyEvent,
      metadata: { flag_type: params.flag_type, severity, ...params.metadata },
      finding_id: params.finding_id,
    });
  }
}

// ── Submission quality check (pre-insert) ──
export async function checkSubmissionQuality(params: {
  user_id: string;
  title: string;
  description?: string;
  protocol_slug: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const supabase = createClient();

  // 1. Rate limit — max 5 submissions per hour per user
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count: recentCount } = await supabase
    .from('findings')
    .select('id', { count: 'exact', head: true })
    .eq('researcher_id', params.user_id)
    .gte('created_at', oneHourAgo);

  if ((recentCount || 0) >= 5) {
    await flagSpam({ user_id: params.user_id, flag_type: 'rate_limit_hit' });
    return { ok: false, reason: 'Rate limit: max 5 submissions per hour' };
  }

  // 2. Title length / quality
  if (params.title.length < 10) {
    return { ok: false, reason: 'Title too short (min 10 chars)' };
  }

  // 3. Check for exact duplicate title to same protocol
  const { data: dupes } = await supabase
    .from('findings')
    .select('id')
    .eq('researcher_id', params.user_id)
    .ilike('title', params.title)
    .limit(1);

  if (dupes && dupes.length > 0) {
    await flagSpam({
      user_id: params.user_id,
      flag_type: 'duplicate_finding',
      metadata: { duplicate_of: dupes[0].id },
    });
    return { ok: false, reason: 'Duplicate submission detected' };
  }

  // 4. Check ban status
  const { count: banCount } = await supabase
    .from('spam_flags')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', params.user_id)
    .eq('severity', 'ban');

  if ((banCount || 0) > 0) {
    return { ok: false, reason: 'Account suspended due to repeated violations' };
  }

  return { ok: true };
}

// ── Streak calculation ──
export async function checkAndAwardStreak(userId: string): Promise<void> {
  const supabase = createClient();
  const season = getCurrentSeason();
  const week = getCurrentWeek();

  // Get all weeks user was active this season
  const { data: activeWeeks } = await supabase
    .from('participation_events')
    .select('week')
    .eq('user_id', userId)
    .eq('season', season)
    .gt('points', 0);

  if (!activeWeeks) return;

  const uniqueWeeks = Array.from(new Set(activeWeeks.map(w => w.week))).sort((a, b) => a - b);

  // Count consecutive weeks ending at current week
  let streak = 0;
  for (let w = week; w >= 1; w--) {
    if (uniqueWeeks.includes(w)) streak++;
    else break;
  }

  // Award streak milestones
  const milestones: Array<{ weeks: number; event: keyof typeof POINTS }> = [
    { weeks: 16, event: 'streak_bonus_16w' },
    { weeks: 8, event: 'streak_bonus_8w' },
    { weeks: 4, event: 'streak_bonus_4w' },
  ];

  for (const m of milestones) {
    if (streak >= m.weeks) {
      // Check if already awarded this milestone this season
      const { count } = await supabase
        .from('participation_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('season', season)
        .eq('event_type', m.event);

      if (!count) {
        await emitParticipationEvent({
          user_id: userId,
          event_type: m.event,
          metadata: { streak_weeks: streak },
        });
      }
      break; // Only award highest milestone
    }
  }

  // Update streak in scores
  await supabase
    .from('contribution_scores')
    .upsert({
      user_id: userId,
      season,
      streak_weeks: streak,
      last_active_at: new Date().toISOString(),
    }, { onConflict: 'user_id,season' });
}

// ── Ranking ──

/**
 * Assign ranks based on total_score descending.
 */
export async function updateRanks(season: number = 1): Promise<void> {
  const supabase = createClient();

  const { data: scores } = await supabase
    .from('contribution_scores')
    .select('id, total_score')
    .eq('season', season)
    .order('total_score', { ascending: false });

  if (!scores) return;

  for (let i = 0; i < scores.length; i++) {
    await supabase
      .from('contribution_scores')
      .update({ rank: i + 1 })
      .eq('id', scores[i].id);
  }
}

// ── Score Decay ──

/**
 * Apply score decay for inactive users.
 * Graduated decay: 3 weeks = 5%, 5 weeks = 10%, 9+ weeks = 15%.
 */
export async function applyDecay(season: number = 1): Promise<number> {
  const supabase = createClient();

  const { data: scores } = await supabase
    .from('contribution_scores')
    .select('id, user_id, last_active_at, total_score')
    .eq('season', season)
    .gt('total_score', 0);

  if (!scores) return 0;

  let decayed = 0;
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  for (const score of scores) {
    if (!score.last_active_at) continue;

    const inactiveMs = now - new Date(score.last_active_at).getTime();
    const inactiveWeeks = Math.floor(inactiveMs / weekMs);

    let decayRate = 0;
    if (inactiveWeeks >= 9) decayRate = 0.15;
    else if (inactiveWeeks >= 5) decayRate = 0.10;
    else if (inactiveWeeks >= 3) decayRate = 0.05;
    else continue; // No decay within grace period

    const newScore = score.total_score * (1 - decayRate);
    await supabase
      .from('contribution_scores')
      .update({ total_score: newScore, updated_at: new Date().toISOString() })
      .eq('id', score.id);
    decayed++;
  }

  return decayed;
}

// ── Batch Recalculation ──

/**
 * Recalculate all user scores for a season, then update ranks.
 */
export async function recalculateAllScores(season: number): Promise<number> {
  const supabase = createClient();
  const { data: userIds } = await supabase
    .from('participation_events')
    .select('user_id')
    .eq('season', season);
  if (!userIds) return 0;
  const uniqueUserIds = Array.from(new Set(userIds.map((r: any) => r.user_id)));
  for (const userId of uniqueUserIds) {
    await recalculateScore(userId, season);
  }
  await updateRanks(season);
  return uniqueUserIds.length;
}
