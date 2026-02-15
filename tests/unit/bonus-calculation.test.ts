/**
 * Unit Tests: Referral Bonus Calculation
 * Tests multi-level bonus distribution (10%, 5%, 2.5%, 1%, 0.5%)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@/lib/supabase/admin'
import { buildReferralTree, qualifyReferralTree } from '@/lib/services/referral-tree'
import { 
  distributeReferralBonuses, 
  getTotalBonusesEarned, 
  getBonusesGenerated,
  getReferralTierPercentage,
  calculatePotentialBonuses,
} from '@/lib/services/referral-bonuses'

const WALLETS = {
  alice: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bob: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  charlie: '0xcccccccccccccccccccccccccccccccccccccccc',
  david: '0xdddddddddddddddddddddddddddddddddddddddd',
  eve: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  frank: '0xffffffffffffffffffffffffffffffffffffffff',
}

const TEST_CODES = {
  alice: 'wc-test01',
  bob: 'wc-test02',
  charlie: 'wc-test03',
  david: 'wc-test04',
  eve: 'wc-test05',
}

describe('Referral Bonus Calculation', () => {
  const supabase = createClient()
  
  beforeEach(async () => {
    // Create test referral links
    await supabase.from('referral_links').insert([
      { wallet_address: WALLETS.alice, code: TEST_CODES.alice },
      { wallet_address: WALLETS.bob, code: TEST_CODES.bob },
      { wallet_address: WALLETS.charlie, code: TEST_CODES.charlie },
      { wallet_address: WALLETS.david, code: TEST_CODES.david },
      { wallet_address: WALLETS.eve, code: TEST_CODES.eve },
    ])
  })
  
  afterEach(async () => {
    await supabase.from('referral_bonuses').delete().in('earner_wallet', Object.values(WALLETS))
    await supabase.from('referral_tree').delete().in('wallet_address', Object.values(WALLETS))
    await supabase.from('referral_links').delete().in('wallet_address', Object.values(WALLETS))
  })
  
  it('should calculate L1 bonus: 10%', () => {
    const percentage = getReferralTierPercentage(1)
    expect(percentage).toBe(0.1)
    
    const basePoints = 1000
    const bonus = Math.floor(basePoints * percentage)
    expect(bonus).toBe(100)
  })
  
  it('should calculate L2 bonus: 5%', () => {
    const percentage = getReferralTierPercentage(2)
    expect(percentage).toBe(0.05)
    
    const basePoints = 1000
    const bonus = Math.floor(basePoints * percentage)
    expect(bonus).toBe(50)
  })
  
  it('should calculate L3 bonus: 2.5%', () => {
    const percentage = getReferralTierPercentage(3)
    expect(percentage).toBe(0.025)
    
    const basePoints = 1000
    const bonus = Math.floor(basePoints * percentage)
    expect(bonus).toBe(25)
  })
  
  it('should calculate L4 bonus: 1%', () => {
    const percentage = getReferralTierPercentage(4)
    expect(percentage).toBe(0.01)
    
    const basePoints = 1000
    const bonus = Math.floor(basePoints * percentage)
    expect(bonus).toBe(10)
  })
  
  it('should calculate L5 bonus: 0.5%', () => {
    const percentage = getReferralTierPercentage(5)
    expect(percentage).toBe(0.005)
    
    const basePoints = 1000
    const bonus = Math.floor(basePoints * percentage)
    expect(bonus).toBe(5)
  })
  
  it('should calculate total distribution across 5 levels', () => {
    const basePoints = 1000
    const bonuses = calculatePotentialBonuses(basePoints, [1, 2, 3, 4, 5])
    
    expect(bonuses[1]).toBe(100)   // 10%
    expect(bonuses[2]).toBe(50)    // 5%
    expect(bonuses[3]).toBe(25)    // 2.5%
    expect(bonuses[4]).toBe(10)    // 1%
    expect(bonuses[5]).toBe(5)     // 0.5%
    
    const total = Object.values(bonuses).reduce((sum, b) => sum + b, 0)
    expect(total).toBe(190)  // 19% total (18.5% rounded up)
  })
  
  it('should distribute bonuses to L1 only (single level)', async () => {
    // Build tree: Alice → Bob
    await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    await qualifyReferralTree(WALLETS.bob, 'finding_accepted')
    
    // Bob earns 1000 points
    const result = await distributeReferralBonuses(
      WALLETS.bob,
      'finding_accepted',
      1000,  // tier1Points
      0,     // tier2Points
      1      // season
    )
    
    expect(result.success).toBe(true)
    expect(result.bonuses_awarded).toBe(1)
    expect(result.total_bonus_points).toBe(100)  // 10% of 1000
    expect(result.upline_wallets).toEqual([WALLETS.alice])
    
    // Verify in database
    const { data: bonuses } = await supabase
      .from('referral_bonuses')
      .select('*')
      .eq('earner_wallet', WALLETS.alice)
    
    expect(bonuses).toHaveLength(1)
    expect(bonuses![0].level).toBe(1)
    expect(bonuses![0].bonus_points).toBe(100)
    expect(bonuses![0].bonus_percentage).toBe(0.1)
  })
  
  it('should distribute bonuses across 2 levels', async () => {
    // Build tree: Alice → Bob → Charlie
    await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    await buildReferralTree(WALLETS.charlie, TEST_CODES.bob)
    
    // Qualify both relationships
    await qualifyReferralTree(WALLETS.bob, 'finding_accepted')
    await qualifyReferralTree(WALLETS.charlie, 'finding_accepted')
    
    // Charlie earns 1000 points
    const result = await distributeReferralBonuses(
      WALLETS.charlie,
      'finding_accepted',
      1000,
      0,
      1
    )
    
    expect(result.success).toBe(true)
    expect(result.bonuses_awarded).toBe(2)
    expect(result.total_bonus_points).toBe(150)  // 100 + 50
    expect(result.upline_wallets).toContain(WALLETS.bob)
    expect(result.upline_wallets).toContain(WALLETS.alice)
    
    // Bob gets L1: 10%
    const { data: bobBonus } = await supabase
      .from('referral_bonuses')
      .select('*')
      .eq('earner_wallet', WALLETS.bob)
      .eq('contributor_wallet', WALLETS.charlie)
      .single()
    
    expect(bobBonus!.bonus_points).toBe(100)
    expect(bobBonus!.level).toBe(1)
    
    // Alice gets L2: 5%
    const { data: aliceBonus } = await supabase
      .from('referral_bonuses')
      .select('*')
      .eq('earner_wallet', WALLETS.alice)
      .eq('contributor_wallet', WALLETS.charlie)
      .single()
    
    expect(aliceBonus!.bonus_points).toBe(50)
    expect(aliceBonus!.level).toBe(2)
  })
  
  it('should distribute bonuses across full 5 levels', async () => {
    // Build chain: Alice → Bob → Charlie → David → Eve → Frank
    await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    await buildReferralTree(WALLETS.charlie, TEST_CODES.bob)
    await buildReferralTree(WALLETS.david, TEST_CODES.charlie)
    await buildReferralTree(WALLETS.eve, TEST_CODES.david)
    await buildReferralTree(WALLETS.frank, TEST_CODES.eve)
    
    // Qualify all
    for (const wallet of [WALLETS.bob, WALLETS.charlie, WALLETS.david, WALLETS.eve, WALLETS.frank]) {
      await qualifyReferralTree(wallet, 'finding_accepted')
    }
    
    // Frank earns 1000 points
    const result = await distributeReferralBonuses(
      WALLETS.frank,
      'finding_accepted',
      1000,
      0,
      1
    )
    
    expect(result.success).toBe(true)
    expect(result.bonuses_awarded).toBe(5)
    expect(result.total_bonus_points).toBe(190)  // 100+50+25+10+5
    
    // Verify each level
    const { data: allBonuses } = await supabase
      .from('referral_bonuses')
      .select('*')
      .eq('contributor_wallet', WALLETS.frank)
      .order('level')
    
    expect(allBonuses).toHaveLength(5)
    expect(allBonuses![0].bonus_points).toBe(100)  // Eve L1
    expect(allBonuses![1].bonus_points).toBe(50)   // David L2
    expect(allBonuses![2].bonus_points).toBe(25)   // Charlie L3
    expect(allBonuses![3].bonus_points).toBe(10)   // Bob L4
    expect(allBonuses![4].bonus_points).toBe(5)    // Alice L5
  })
  
  it('should only distribute to QUALIFIED upline', async () => {
    // Build tree but don't qualify Bob
    await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    await buildReferralTree(WALLETS.charlie, TEST_CODES.bob)
    
    // Only qualify Charlie's relationship (not Bob's)
    await qualifyReferralTree(WALLETS.charlie, 'finding_accepted')
    
    // Charlie earns points
    const result = await distributeReferralBonuses(
      WALLETS.charlie,
      'finding_accepted',
      1000,
      0,
      1
    )
    
    expect(result.success).toBe(true)
    expect(result.bonuses_awarded).toBe(1)  // Only Bob (L1)
    // Alice should NOT get bonus because Bob's relationship is not qualified
  })
  
  it('should not distribute bonuses for zero points', async () => {
    await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    await qualifyReferralTree(WALLETS.bob, 'finding_accepted')
    
    const result = await distributeReferralBonuses(
      WALLETS.bob,
      'finding_accepted',
      0,  // Zero points
      0,
      1
    )
    
    expect(result.success).toBe(true)
    expect(result.bonuses_awarded).toBe(0)
    expect(result.total_bonus_points).toBe(0)
  })
  
  it('should track total bonuses earned by wallet', async () => {
    await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    await qualifyReferralTree(WALLETS.bob, 'finding_accepted')
    
    // Bob earns points 3 times
    await distributeReferralBonuses(WALLETS.bob, 'finding_accepted', 1000, 0, 1)
    await distributeReferralBonuses(WALLETS.bob, 'finding_accepted', 500, 0, 1)
    await distributeReferralBonuses(WALLETS.bob, 'finding_accepted', 2000, 0, 1)
    
    // Alice should have earned: 100 + 50 + 200 = 350 points
    const earned = await getTotalBonusesEarned(WALLETS.alice, 1)
    
    expect(earned.total_points).toBe(350)
    expect(earned.by_level[1]).toBe(350)
  })
  
  it('should track bonuses generated by contributor', async () => {
    await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    await buildReferralTree(WALLETS.charlie, TEST_CODES.bob)
    await qualifyReferralTree(WALLETS.bob, 'finding_accepted')
    await qualifyReferralTree(WALLETS.charlie, 'finding_accepted')
    
    // Charlie earns 1000 points
    await distributeReferralBonuses(WALLETS.charlie, 'finding_accepted', 1000, 0, 1)
    
    // Charlie generated bonuses for 2 people (Bob + Alice)
    const generated = await getBonusesGenerated(WALLETS.charlie, 1)
    
    expect(generated.total_generated).toBe(150)  // 100 + 50
    expect(generated.upline_count).toBe(2)
  })
})
