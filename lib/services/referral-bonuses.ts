/**
 * Referral Bonus Distribution Engine
 * Awards bonuses to upline when downline earns points
 */

import { createClient } from '@/lib/supabase/admin'
import { emitParticipationEvent } from './points-engine'

// Referral tier percentages (L1-L5)
const REFERRAL_TIERS = {
  1: 0.1000,  // 10%
  2: 0.0500,  // 5%
  3: 0.0250,  // 2.5%
  4: 0.0100,  // 1%
  5: 0.0050,  // 0.5%
} as const

export interface BonusDistributionResult {
  success: boolean
  bonuses_awarded: number
  total_bonus_points: number
  upline_wallets: string[]
  error?: string
}

/**
 * Distribute referral bonuses to upline when contributor earns Tier 1+2 points
 * Only distributes to QUALIFIED upline members
 */
export async function distributeReferralBonuses(
  contributorWallet: string,
  actionType: 'finding_accepted' | 'protocol_registered' | 'bounty_funded' | 'escrow_funded',
  tier1Points: number,
  tier2Points: number,
  season: number = 1
): Promise<BonusDistributionResult> {
  const supabase = createClient()
  const wallet = contributorWallet.toLowerCase()
  const basePoints = tier1Points + tier2Points
  
  if (basePoints <= 0) {
    return {
      success: true,
      bonuses_awarded: 0,
      total_bonus_points: 0,
      upline_wallets: [],
    }
  }
  
  // 1. Get contributor's qualified upline (L1-L5)
  const { data: upline, error: uplineError } = await supabase
    .from('referral_tree')
    .select('referrer_wallet, level')
    .eq('wallet_address', wallet)
    .eq('qualified', true)
    .order('level', { ascending: true })
  
  if (uplineError) {
    console.error('[BonusDistribution] Error fetching upline:', uplineError)
    return {
      success: false,
      bonuses_awarded: 0,
      total_bonus_points: 0,
      upline_wallets: [],
      error: uplineError.message,
    }
  }
  
  if (!upline || upline.length === 0) {
    // No qualified upline - contributor was not referred or upline not qualified yet
    return {
      success: true,
      bonuses_awarded: 0,
      total_bonus_points: 0,
      upline_wallets: [],
    }
  }
  
  // 2. Calculate and award bonuses for each level
  const bonusRecords = []
  const uplineWallets = []
  let totalBonusPoints = 0
  
  for (const ancestor of upline) {
    const level = ancestor.level as keyof typeof REFERRAL_TIERS
    const percentage = REFERRAL_TIERS[level]
    
    if (!percentage) {
      console.warn(`[BonusDistribution] Invalid level ${level} for ${ancestor.referrer_wallet}`)
      continue
    }
    
    const bonusPoints = Math.floor(basePoints * percentage)
    
    if (bonusPoints <= 0) continue
    
    bonusRecords.push({
      earner_wallet: ancestor.referrer_wallet,
      contributor_wallet: wallet,
      level,
      action_type: actionType,
      base_points: basePoints,
      bonus_percentage: percentage,
      bonus_points: bonusPoints,
      season,
    })
    
    uplineWallets.push(ancestor.referrer_wallet)
    totalBonusPoints += bonusPoints
  }
  
  if (bonusRecords.length === 0) {
    return {
      success: true,
      bonuses_awarded: 0,
      total_bonus_points: 0,
      upline_wallets: [],
    }
  }
  
  // 3. Insert bonus records
  const { error: insertError } = await supabase
    .from('referral_bonuses')
    .insert(bonusRecords)
  
  if (insertError) {
    console.error('[BonusDistribution] Insert error:', insertError)
    return {
      success: false,
      bonuses_awarded: 0,
      total_bonus_points: 0,
      upline_wallets: [],
      error: insertError.message,
    }
  }
  
  // 4. Award points to each upline member via points engine
  for (const record of bonusRecords) {
    // Get user_id for wallet (needed for points engine)
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', record.earner_wallet)
      .single()
    
    if (!userData) {
      console.warn(`[BonusDistribution] User not found for wallet ${record.earner_wallet}`)
      continue
    }
    
    // Emit participation event for referral bonus
    await emitParticipationEvent({
      user_id: userData.id,
      event_type: 'referral_bonus',
      points: record.bonus_points,
      metadata: {
        contributor_wallet: record.contributor_wallet,
        level: record.level,
        action_type: record.action_type,
        base_points: record.base_points,
        bonus_percentage: record.bonus_percentage,
      },
      wallet_address: record.earner_wallet,
    })
  }
  
  return {
    success: true,
    bonuses_awarded: bonusRecords.length,
    total_bonus_points: totalBonusPoints,
    upline_wallets: uplineWallets,
  }
}

/**
 * Get total bonuses earned by a wallet in a season
 */
export async function getTotalBonusesEarned(
  wallet: string,
  season: number = 1
): Promise<{ total_points: number; by_level: Record<number, number> }> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('referral_bonuses')
    .select('level, bonus_points')
    .eq('earner_wallet', wallet.toLowerCase())
    .eq('season', season)
  
  if (error || !data) {
    return { total_points: 0, by_level: {} }
  }
  
  const byLevel: Record<number, number> = {}
  let totalPoints = 0
  
  for (const bonus of data) {
    totalPoints += bonus.bonus_points
    byLevel[bonus.level] = (byLevel[bonus.level] || 0) + bonus.bonus_points
  }
  
  return { total_points: totalPoints, by_level: byLevel }
}

/**
 * Get bonuses a wallet has generated for their upline (contributor perspective)
 */
export async function getBonusesGenerated(
  contributorWallet: string,
  season: number = 1
): Promise<{ total_generated: number; upline_count: number }> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('referral_bonuses')
    .select('bonus_points, earner_wallet')
    .eq('contributor_wallet', contributorWallet.toLowerCase())
    .eq('season', season)
  
  if (error || !data) {
    return { total_generated: 0, upline_count: 0 }
  }
  
  const totalGenerated = data.reduce((sum, b) => sum + b.bonus_points, 0)
  const uniqueUpline = new Set(data.map(b => b.earner_wallet)).size
  
  return {
    total_generated: totalGenerated,
    upline_count: uniqueUpline,
  }
}

/**
 * Get referral tier percentage for a given level
 */
export function getReferralTierPercentage(level: number): number {
  return REFERRAL_TIERS[level as keyof typeof REFERRAL_TIERS] || 0
}

/**
 * Calculate potential bonus for contributor's upline
 * (Used for preview/estimation before actual distribution)
 */
export function calculatePotentialBonuses(
  basePoints: number,
  uplineLevels: number[]
): Record<number, number> {
  const bonuses: Record<number, number> = {}
  
  for (const level of uplineLevels) {
    const percentage = REFERRAL_TIERS[level as keyof typeof REFERRAL_TIERS]
    if (percentage) {
      bonuses[level] = Math.floor(basePoints * percentage)
    }
  }
  
  return bonuses
}
