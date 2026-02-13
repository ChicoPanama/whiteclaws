/**
 * Season Configuration — manages season lifecycle.
 *
 * Seasons flow: pending → active → frozen → claiming → completed
 * Parameters stored in season_config table.
 */

import { createClient } from '@/lib/supabase/admin'

export interface SeasonConfig {
  season: number
  start_date: string | null
  end_date: string | null
  pool_size: number | null
  status: 'pending' | 'active' | 'frozen' | 'claiming' | 'completed'
  weekly_cap: number
  metadata: Record<string, any>
}

/**
 * Get current season config.
 */
export async function getCurrentSeason(): Promise<SeasonConfig | null> {
  const supabase = createClient()

  const { data } = await (supabase
    .from('season_config')
    .select('*')
    .in('status', ['pending', 'active', 'frozen', 'claiming'])
    .order('season', { ascending: false })
    .limit(1)
    .maybeSingle())

  return data as SeasonConfig | null
}

/**
 * Get season status.
 */
export async function getSeasonStatus(season: number = 1): Promise<string> {
  const supabase = createClient()

  const { data } = await (supabase
    .from('season_config')
    .select('status')
    .eq('season', season)
    .single())

  return data?.status || 'pending'
}

/**
 * Freeze a season — stops new events from recording.
 */
export async function freezeSeason(season: number): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await (supabase
    .from('season_config')
    .update({
      status: 'frozen',
      end_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('season', season)
    .eq('status', 'active'))

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Activate a season.
 */
export async function activateSeason(
  season: number,
  poolSize?: number,
  weeklyCap?: number
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()

  const updates: Record<string, any> = {
    status: 'active',
    start_date: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (poolSize) updates.pool_size = poolSize
  if (weeklyCap) updates.weekly_cap = weeklyCap

  const { error } = await (supabase
    .from('season_config')
    .update(updates)
    .eq('season', season))

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Transition season to claiming phase.
 */
export async function openClaimWindow(season: number): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await (supabase
    .from('season_config')
    .update({
      status: 'claiming',
      updated_at: new Date().toISOString(),
    })
    .eq('season', season)
    .eq('status', 'frozen'))

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Complete a season.
 */
export async function completeSeason(season: number): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await (supabase
    .from('season_config')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('season', season))

  if (error) return { ok: false, error: error.message }

  // Seed next season
  const nextSeason = season + 1
  try {
    await supabase.from('season_config').insert({
      season: nextSeason,
      status: 'pending',
    })
  } catch {
    // Ignore if exists
  }

  return { ok: true }
}
