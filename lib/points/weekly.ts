/**
 * Weekly Activity Tracker — calculates weekly_active, weekly_submission,
 * streak_bonus, and heartbeat_active events.
 *
 * Designed to run via cron (Supabase Edge Function or Vercel Cron)
 * at the end of each week, or on-demand via /api/admin/points/weekly.
 */

import { createClient } from '@/lib/supabase/admin'
import { recordEvent, getSeasonWeek } from '@/lib/points/engine'

const STREAK_MILESTONES = [4, 8, 12, 26, 52] // weeks for bonus

/**
 * Process weekly activity for all SBT holders.
 * Returns count of users processed.
 */
export async function processWeeklyActivity(): Promise<{
  processed: number
  activeUsers: number
  streakBonuses: number
}> {
  const supabase = createClient()
  const { season, week } = getSeasonWeek()
  const previousWeek = week - 1

  // Get all users with SBTs
  const { data: sbtHolders } = await (supabase
    .from('access_sbt')
    .select('user_id')
    .eq('status', 'active'))

  if (!sbtHolders) return { processed: 0, activeUsers: 0, streakBonuses: 0 }

  let activeUsers = 0
  let streakBonuses = 0

  for (const holder of sbtHolders) {
    const userId = holder.user_id

    // Check if user had any events this week (excluding weekly_* events themselves)
    const { data: weekEvents } = await (supabase
      .from('participation_events')
      .select('event_type')
      .eq('user_id', userId)
      .eq('season', season)
      .eq('week', week)
      .not('event_type', 'in', '("weekly_active","weekly_submission","streak_bonus","heartbeat_active")')
      .limit(1))

    const isActive = weekEvents && weekEvents.length > 0

    if (isActive) {
      activeUsers++
      await recordEvent(userId, 'weekly_active', { season, week })

      // Check for submissions this week
      const { data: submissions } = await (supabase
        .from('participation_events')
        .select('id')
        .eq('user_id', userId)
        .eq('season', season)
        .eq('week', week)
        .eq('event_type', 'finding_submitted')
        .limit(1))

      if (submissions && submissions.length > 0) {
        await recordEvent(userId, 'weekly_submission', { season, week })
      }

      // Calculate streak
      const { data: score } = await (supabase
        .from('contribution_scores')
        .select('streak_weeks')
        .eq('user_id', userId)
        .eq('season', season)
        .maybeSingle())

      const currentStreak = (score?.streak_weeks || 0) + 1

      // Update streak in contribution_scores
      await (supabase
        .from('contribution_scores')
        .upsert(
          {
            user_id: userId,
            season,
            streak_weeks: currentStreak,
            last_active_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,season' }
        ))

      // Check for streak milestones
      if (STREAK_MILESTONES.includes(currentStreak)) {
        await recordEvent(userId, 'streak_bonus', {
          season,
          week,
          streak_weeks: currentStreak,
          milestone: currentStreak,
        })
        streakBonuses++
      }
    } else {
      // Reset streak for inactive users
      await (supabase
        .from('contribution_scores')
        .upsert(
          {
            user_id: userId,
            season,
            streak_weeks: 0,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,season' }
        ))
    }
  }

  return { processed: sbtHolders.length, activeUsers, streakBonuses }
}
