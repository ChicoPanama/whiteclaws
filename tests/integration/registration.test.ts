/**
 * Integration Tests: Registration Flow
 * Tests end-to-end agent registration with referrals
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@/lib/supabase/admin'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const TEST_WALLETS = {
  alice: '0xaaaa0000000000000000000000000000000000aa',
  bob: '0xbbbb0000000000000000000000000000000000bb',
  charlie: '0xcccc0000000000000000000000000000000000cc',
}

describe('Registration Flow Integration', () => {
  const supabase = createClient()
  const registeredUsers: string[] = []
  
  afterEach(async () => {
    // Cleanup: delete test users
    if (registeredUsers.length > 0) {
      await supabase.from('users').delete().in('wallet_address', registeredUsers)
      await supabase.from('referral_links').delete().in('wallet_address', registeredUsers)
      await supabase.from('referral_tree').delete().in('wallet_address', registeredUsers)
    }
    registeredUsers.length = 0
  })
  
  it('should register agent without referral', async () => {
    const response = await fetch(`${API_BASE}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'test-alice',
        name: 'Alice Agent',
        wallet_address: TEST_WALLETS.alice,
      }),
    })
    
    expect(response.status).toBe(201)
    
    const data = await response.json()
    
    expect(data.agent).toBeDefined()
    expect(data.agent.wallet).toBe(TEST_WALLETS.alice.toLowerCase())
    expect(data.api_key).toBeDefined()
    expect(data.referral.code).toBeDefined()
    expect(data.referral.link).toContain('whiteclaws.xyz/ref/')
    expect(data.referral.upline_levels).toBe(0)
    
    registeredUsers.push(TEST_WALLETS.alice.toLowerCase())
  })
  
  it('should register agent with valid referral code', async () => {
    // Register Alice first
    const aliceRes = await fetch(`${API_BASE}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'test-alice-ref',
        name: 'Alice',
        wallet_address: TEST_WALLETS.alice,
      }),
    })
    
    const aliceData = await aliceRes.json()
    const aliceReferralCode = aliceData.referral.code
    registeredUsers.push(TEST_WALLETS.alice.toLowerCase())
    
    // Bob registers with Alice's code
    const bobRes = await fetch(`${API_BASE}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'test-bob-ref',
        name: 'Bob',
        wallet_address: TEST_WALLETS.bob,
        referral_code: aliceReferralCode,
      }),
    })
    
    expect(bobRes.status).toBe(201)
    
    const bobData = await bobRes.json()
    expect(bobData.referral.upline_levels).toBe(1)
    
    registeredUsers.push(TEST_WALLETS.bob.toLowerCase())
    
    // Verify referral tree in database
    const { data: tree } = await supabase
      .from('referral_tree')
      .select('*')
      .eq('wallet_address', TEST_WALLETS.bob.toLowerCase())
    
    expect(tree).toHaveLength(1)
    expect(tree![0].referrer_wallet).toBe(TEST_WALLETS.alice.toLowerCase())
    expect(tree![0].level).toBe(1)
  })
  
  it('should register with invalid referral code gracefully', async () => {
    const response = await fetch(`${API_BASE}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'test-invalid-ref',
        name: 'Test User',
        wallet_address: TEST_WALLETS.alice,
        referral_code: 'wc-invalid99',
      }),
    })
    
    // Should still succeed (registration doesn't fail on bad referral)
    expect(response.status).toBe(201)
    
    const data = await response.json()
    expect(data.referral.upline_levels).toBe(0)
    
    registeredUsers.push(TEST_WALLETS.alice.toLowerCase())
  })
  
  it('should reject duplicate wallet registration', async () => {
    // Register once
    await fetch(`${API_BASE}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'test-dup1',
        name: 'First',
        wallet_address: TEST_WALLETS.alice,
      }),
    })
    
    registeredUsers.push(TEST_WALLETS.alice.toLowerCase())
    
    // Try to register same wallet again
    const dupRes = await fetch(`${API_BASE}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'test-dup2',
        name: 'Second',
        wallet_address: TEST_WALLETS.alice,
      }),
    })
    
    expect(dupRes.status).toBe(409)
    
    const data = await dupRes.json()
    expect(data.error).toContain('already registered')
    expect(data.existing_handle).toBe('test-dup1')
  })
  
  it('should reject duplicate handle', async () => {
    // Register with handle
    await fetch(`${API_BASE}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'same-handle',
        name: 'User 1',
        wallet_address: TEST_WALLETS.alice,
      }),
    })
    
    registeredUsers.push(TEST_WALLETS.alice.toLowerCase())
    
    // Try same handle with different wallet
    const dupRes = await fetch(`${API_BASE}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'same-handle',
        name: 'User 2',
        wallet_address: TEST_WALLETS.bob,
      }),
    })
    
    expect(dupRes.status).toBe(409)
    expect((await dupRes.json()).error).toContain('Handle already taken')
  })
  
  it('should validate required fields', async () => {
    const response = await fetch(`${API_BASE}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'test',
        // Missing name and wallet_address
      }),
    })
    
    expect(response.status).toBe(400)
    expect((await response.json()).error).toBeDefined()
  })
  
  it('should validate wallet format', async () => {
    const response = await fetch(`${API_BASE}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'test-invalid',
        name: 'Test',
        wallet_address: 'not-a-valid-wallet',
      }),
    })
    
    expect(response.status).toBe(400)
    expect((await response.json()).error).toContain('Invalid wallet')
  })
  
  it('should normalize wallet to lowercase', async () => {
    const mixedCaseWallet = '0xABCDef0123456789ABCDEF0123456789ABCDEF01'
    
    const response = await fetch(`${API_BASE}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'test-mixed-case',
        name: 'Test',
        wallet_address: mixedCaseWallet,
      }),
    })
    
    expect(response.status).toBe(201)
    
    const data = await response.json()
    expect(data.agent.wallet).toBe(mixedCaseWallet.toLowerCase())
    
    registeredUsers.push(mixedCaseWallet.toLowerCase())
  })
  
  it('should auto-generate referral code on registration', async () => {
    const response = await fetch(`${API_BASE}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'test-auto-ref',
        name: 'Test',
        wallet_address: TEST_WALLETS.alice,
      }),
    })
    
    const data = await response.json()
    
    expect(data.referral.code).toMatch(/^wc-[a-z0-9]{6}$/)
    expect(data.referral.link).toBe(`https://whiteclaws.xyz/ref/${data.referral.code}`)
    
    registeredUsers.push(TEST_WALLETS.alice.toLowerCase())
    
    // Verify in database
    const { data: refLink } = await supabase
      .from('referral_links')
      .select('code')
      .eq('wallet_address', TEST_WALLETS.alice.toLowerCase())
      .single()
    
    expect(refLink!.code).toBe(data.referral.code)
  })
})
