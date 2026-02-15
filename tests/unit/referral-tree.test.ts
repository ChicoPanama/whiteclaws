/**
 * Unit Tests: Referral Tree Builder
 * Tests multi-level referral tree construction (L1-L5)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@/lib/supabase/admin'
import { buildReferralTree, qualifyReferralTree, getUpline, hasReferrer } from '@/lib/services/referral-tree'

// Test wallet addresses
const WALLETS = {
  alice: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bob: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  charlie: '0xcccccccccccccccccccccccccccccccccccccccc',
  david: '0xdddddddddddddddddddddddddddddddddddddddd',
  eve: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  frank: '0xffffffffffffffffffffffffffffffffffffffff',
  grace: '0x1111111111111111111111111111111111111111',
}

const TEST_CODES = {
  alice: 'wc-alice1',
  bob: 'wc-bob222',
  charlie: 'wc-char33',
  david: 'wc-dav444',
  eve: 'wc-eve555',
}

describe('Referral Tree Builder', () => {
  const supabase = createClient()
  
  // Setup: Create test referral links
  beforeEach(async () => {
    // Create referral links for Alice, Bob, Charlie, David, Eve
    await supabase.from('referral_links').insert([
      { wallet_address: WALLETS.alice, code: TEST_CODES.alice },
      { wallet_address: WALLETS.bob, code: TEST_CODES.bob },
      { wallet_address: WALLETS.charlie, code: TEST_CODES.charlie },
      { wallet_address: WALLETS.david, code: TEST_CODES.david },
      { wallet_address: WALLETS.eve, code: TEST_CODES.eve },
    ])
  })
  
  // Cleanup: Remove test data
  afterEach(async () => {
    await supabase.from('referral_tree').delete().in('wallet_address', Object.values(WALLETS))
    await supabase.from('referral_links').delete().in('wallet_address', Object.values(WALLETS))
  })
  
  it('should create 1-level tree (Alice → Bob)', async () => {
    const result = await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    
    expect(result.success).toBe(true)
    expect(result.levels_created).toBe(1)
    expect(result.upline_path).toEqual([WALLETS.alice])
    
    // Verify in database
    const { data: tree } = await supabase
      .from('referral_tree')
      .select('*')
      .eq('wallet_address', WALLETS.bob)
      .order('level')
    
    expect(tree).toHaveLength(1)
    expect(tree![0].level).toBe(1)
    expect(tree![0].referrer_wallet).toBe(WALLETS.alice)
    expect(tree![0].upline_path).toEqual([WALLETS.alice])
  })
  
  it('should create 2-level tree (Alice → Bob → Charlie)', async () => {
    // Bob refers to Alice
    await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    
    // Charlie refers to Bob
    const result = await buildReferralTree(WALLETS.charlie, TEST_CODES.bob)
    
    expect(result.success).toBe(true)
    expect(result.levels_created).toBe(2)
    expect(result.upline_path).toEqual([WALLETS.bob, WALLETS.alice])
    
    // Verify Charlie's tree
    const { data: tree } = await supabase
      .from('referral_tree')
      .select('*')
      .eq('wallet_address', WALLETS.charlie)
      .order('level')
    
    expect(tree).toHaveLength(2)
    
    // L1: Charlie → Bob
    expect(tree![0].level).toBe(1)
    expect(tree![0].referrer_wallet).toBe(WALLETS.bob)
    
    // L2: Charlie → Alice
    expect(tree![1].level).toBe(2)
    expect(tree![1].referrer_wallet).toBe(WALLETS.alice)
  })
  
  it('should create 5-level tree (max depth)', async () => {
    // Build chain: Alice → Bob → Charlie → David → Eve → Frank
    await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    await buildReferralTree(WALLETS.charlie, TEST_CODES.bob)
    await buildReferralTree(WALLETS.david, TEST_CODES.charlie)
    await buildReferralTree(WALLETS.eve, TEST_CODES.david)
    
    const result = await buildReferralTree(WALLETS.frank, TEST_CODES.eve)
    
    expect(result.success).toBe(true)
    expect(result.levels_created).toBe(5)
    expect(result.upline_path).toEqual([
      WALLETS.eve,
      WALLETS.david,
      WALLETS.charlie,
      WALLETS.bob,
      WALLETS.alice,
    ])
    
    // Verify Frank's tree has exactly 5 levels
    const { data: tree } = await supabase
      .from('referral_tree')
      .select('*')
      .eq('wallet_address', WALLETS.frank)
    
    expect(tree).toHaveLength(5)
  })
  
  it('should enforce max depth at L5 (not go beyond)', async () => {
    // Build 6-level chain attempt
    await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    await buildReferralTree(WALLETS.charlie, TEST_CODES.bob)
    await buildReferralTree(WALLETS.david, TEST_CODES.charlie)
    await buildReferralTree(WALLETS.eve, TEST_CODES.david)
    await buildReferralTree(WALLETS.frank, TEST_CODES.eve)
    
    // Grace tries to join (would be L6 from Alice)
    const result = await buildReferralTree(WALLETS.grace, TEST_CODES.frank)
    
    expect(result.success).toBe(true)
    expect(result.levels_created).toBe(5)  // Capped at 5
    
    // Verify Grace's tree stops at L5
    const { data: tree } = await supabase
      .from('referral_tree')
      .select('*')
      .eq('wallet_address', WALLETS.grace)
    
    expect(tree).toHaveLength(5)
    
    // Verify Alice is NOT in Grace's upline (would be L6)
    const aliceInUpline = tree!.some(t => t.referrer_wallet === WALLETS.alice)
    expect(aliceInUpline).toBe(false)
  })
  
  it('should prevent self-referral', async () => {
    const result = await buildReferralTree(WALLETS.alice, TEST_CODES.alice)
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('yourself')
  })
  
  it('should prevent circular referral (A→B→A)', async () => {
    // Bob refers to Alice
    await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    
    // Alice tries to refer to Bob (circular!)
    const result = await buildReferralTree(WALLETS.alice, TEST_CODES.bob)
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('circular')
  })
  
  it('should reject invalid referral code', async () => {
    const result = await buildReferralTree(WALLETS.bob, 'wc-invalid')
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid referral code')
  })
  
  it('should qualify referral tree when action completed', async () => {
    await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    
    // Before qualification
    const { data: beforeTree } = await supabase
      .from('referral_tree')
      .select('qualified')
      .eq('wallet_address', WALLETS.bob)
    
    expect(beforeTree![0].qualified).toBe(false)
    
    // Qualify
    const qualifyResult = await qualifyReferralTree(WALLETS.bob, 'finding_accepted')
    
    expect(qualifyResult.qualified_count).toBe(1)
    
    // After qualification
    const { data: afterTree } = await supabase
      .from('referral_tree')
      .select('qualified, qualifying_action')
      .eq('wallet_address', WALLETS.bob)
    
    expect(afterTree![0].qualified).toBe(true)
    expect(afterTree![0].qualifying_action).toBe('finding_accepted')
  })
  
  it('should get upline correctly', async () => {
    await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    await buildReferralTree(WALLETS.charlie, TEST_CODES.bob)
    
    const upline = await getUpline(WALLETS.charlie)
    
    expect(upline).toHaveLength(2)
    expect(upline[0].referrer_wallet).toBe(WALLETS.bob)
    expect(upline[0].level).toBe(1)
    expect(upline[1].referrer_wallet).toBe(WALLETS.alice)
    expect(upline[1].level).toBe(2)
  })
  
  it('should detect if wallet has referrer', async () => {
    const hasRefBefore = await hasReferrer(WALLETS.bob)
    expect(hasRefBefore).toBe(false)
    
    await buildReferralTree(WALLETS.bob, TEST_CODES.alice)
    
    const hasRefAfter = await hasReferrer(WALLETS.bob)
    expect(hasRefAfter).toBe(true)
  })
})
