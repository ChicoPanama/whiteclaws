/**
 * Security Test: Rate Limiting
 * Tests rate limit enforcement across endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@/lib/supabase/admin'
import { 
  checkRateLimit, 
  checkProtocolCooldown,
  cleanupExpiredBuckets,
} from '@/lib/services/rate-limiting'

const TEST_WALLET = '0xratelimit11111111111111111111111111111'
const TEST_IP = '192.168.1.100'

describe('Rate Limiting', () => {
  const supabase = createClient()
  
  afterEach(async () => {
    // Cleanup rate limit buckets
    await supabase
      .from('rate_limit_buckets')
      .delete()
      .like('bucket_key', '%ratelimit%')
    
    await supabase
      .from('rate_limit_buckets')
      .delete()
      .like('bucket_key', `%${TEST_IP}%`)
  })
  
  it('should allow requests under rate limit', async () => {
    const result1 = await checkRateLimit('submission_wallet', TEST_WALLET)
    expect(result1.allowed).toBe(true)
    expect(result1.remaining).toBe(9) // 10 max - 1 used = 9
    
    const result2 = await checkRateLimit('submission_wallet', TEST_WALLET)
    expect(result2.allowed).toBe(true)
    expect(result2.remaining).toBe(8)
  })
  
  it('should block requests over rate limit', async () => {
    // Exhaust limit (10 submissions per day)
    for (let i = 0; i < 10; i++) {
      const result = await checkRateLimit('submission_wallet', TEST_WALLET)
      expect(result.allowed).toBe(true)
    }
    
    // 11th request should be blocked
    const blocked = await checkRateLimit('submission_wallet', TEST_WALLET)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retry_after_seconds).toBeGreaterThan(0)
  })
  
  it('should reset after window expires', async () => {
    // Use up limit
    for (let i = 0; i < 10; i++) {
      await checkRateLimit('submission_wallet', TEST_WALLET)
    }
    
    // Manually expire the bucket
    await supabase
      .from('rate_limit_buckets')
      .update({ reset_at: new Date(Date.now() - 1000).toISOString() })
      .eq('bucket_key', `submission_wallet:${TEST_WALLET}`)
    
    // Should allow again (new window)
    const result = await checkRateLimit('submission_wallet', TEST_WALLET)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
  })
  
  it('should enforce different limits per action type', async () => {
    // Registration: 5 per hour
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit('registration_ip', TEST_IP)
      expect(result.allowed).toBe(true)
    }
    
    const blocked = await checkRateLimit('registration_ip', TEST_IP)
    expect(blocked.allowed).toBe(false)
    
    // Submission (different limit): Should still be allowed
    const subResult = await checkRateLimit('submission_ip', TEST_IP)
    expect(subResult.allowed).toBe(true)
  })
  
  it('should track separate buckets per identifier', async () => {
    const wallet1 = '0xwallet111111111111111111111111111111111'
    const wallet2 = '0xwallet222222222222222222222222222222222'
    
    // Use up wallet1's limit
    for (let i = 0; i < 10; i++) {
      await checkRateLimit('submission_wallet', wallet1)
    }
    
    const wallet1Blocked = await checkRateLimit('submission_wallet', wallet1)
    expect(wallet1Blocked.allowed).toBe(false)
    
    // Wallet2 should still have full limit
    const wallet2Result = await checkRateLimit('submission_wallet', wallet2)
    expect(wallet2Result.allowed).toBe(true)
    expect(wallet2Result.remaining).toBe(9)
    
    // Cleanup
    await supabase.from('rate_limit_buckets').delete().in('bucket_key', [
      `submission_wallet:${wallet1}`,
      `submission_wallet:${wallet2}`,
    ])
  })
  
  it('should return accurate retry_after_seconds', async () => {
    // Exhaust limit
    for (let i = 0; i < 10; i++) {
      await checkRateLimit('submission_wallet', TEST_WALLET)
    }
    
    const blocked = await checkRateLimit('submission_wallet', TEST_WALLET)
    
    expect(blocked.retry_after_seconds).toBeDefined()
    expect(blocked.retry_after_seconds!).toBeGreaterThan(0)
    expect(blocked.retry_after_seconds!).toBeLessThanOrEqual(86400) // 24h window
  })
  
  it('should cleanup expired buckets', async () => {
    // Create expired bucket
    await supabase.from('rate_limit_buckets').insert({
      bucket_key: 'test:expired',
      count: 5,
      reset_at: new Date(Date.now() - 10000).toISOString(), // 10 sec ago
      window_seconds: 3600,
    })
    
    // Create valid bucket
    await supabase.from('rate_limit_buckets').insert({
      bucket_key: 'test:valid',
      count: 3,
      reset_at: new Date(Date.now() + 3600000).toISOString(), // 1h future
      window_seconds: 3600,
    })
    
    const { deleted } = await cleanupExpiredBuckets()
    expect(deleted).toBeGreaterThanOrEqual(1)
    
    // Verify expired is gone, valid remains
    const { data: expired } = await supabase
      .from('rate_limit_buckets')
      .select('*')
      .eq('bucket_key', 'test:expired')
      .maybeSingle()
    
    expect(expired).toBeNull()
    
    const { data: valid } = await supabase
      .from('rate_limit_buckets')
      .select('*')
      .eq('bucket_key', 'test:valid')
      .maybeSingle()
    
    expect(valid).not.toBeNull()
    
    // Cleanup
    await supabase.from('rate_limit_buckets').delete().eq('bucket_key', 'test:valid')
  })
  
  it('should enforce protocol cooldown', async () => {
    // Setup: create test user and protocol
    const { data: user } = await supabase.from('users').insert({
      handle: 'cooldown-test',
      display_name: 'Test',
      wallet_address: TEST_WALLET.toLowerCase(),
      is_agent: true,
    }).select().single()
    
    const { data: protocol } = await supabase.from('protocols').insert({
      slug: 'cooldown-protocol',
      name: 'Test Protocol',
    }).select().single()
    
    // Submit finding
    await supabase.from('findings').insert({
      researcher_id: user!.id,
      protocol_id: protocol!.id,
      title: 'Test Finding',
      severity: 'medium',
      status: 'triaged',
    })
    
    // Check cooldown immediately
    const cooldown = await checkProtocolCooldown(TEST_WALLET, 'cooldown-protocol', 24)
    
    expect(cooldown.allowed).toBe(false)
    expect(cooldown.last_submission).toBeDefined()
    expect(cooldown.retry_after_seconds).toBeGreaterThan(0)
    expect(cooldown.retry_after_seconds!).toBeLessThanOrEqual(86400) // 24h
    
    // Cleanup
    await supabase.from('findings').delete().eq('researcher_id', user!.id)
    await supabase.from('users').delete().eq('id', user!.id)
    await supabase.from('protocols').delete().eq('id', protocol!.id)
  })
  
  it('should allow submission to different protocol during cooldown', async () => {
    // Setup
    const { data: user } = await supabase.from('users').insert({
      handle: 'multi-protocol-test',
      display_name: 'Test',
      wallet_address: TEST_WALLET.toLowerCase(),
      is_agent: true,
    }).select().single()
    
    const { data: protocol1 } = await supabase.from('protocols').insert({
      slug: 'protocol-one',
      name: 'Protocol One',
    }).select().single()
    
    const { data: protocol2 } = await supabase.from('protocols').insert({
      slug: 'protocol-two',
      name: 'Protocol Two',
    }).select().single()
    
    // Submit to protocol1
    await supabase.from('findings').insert({
      researcher_id: user!.id,
      protocol_id: protocol1!.id,
      title: 'Finding 1',
      severity: 'medium',
      status: 'triaged',
    })
    
    // Cooldown on protocol1
    const cooldown1 = await checkProtocolCooldown(TEST_WALLET, 'protocol-one', 24)
    expect(cooldown1.allowed).toBe(false)
    
    // Should allow submission to protocol2
    const cooldown2 = await checkProtocolCooldown(TEST_WALLET, 'protocol-two', 24)
    expect(cooldown2.allowed).toBe(true)
    
    // Cleanup
    await supabase.from('findings').delete().eq('researcher_id', user!.id)
    await supabase.from('users').delete().eq('id', user!.id)
    await supabase.from('protocols').delete().in('id', [protocol1!.id, protocol2!.id])
  })
  
  it('should handle concurrent rate limit requests safely', async () => {
    // Simulate multiple simultaneous requests
    const promises = []
    
    for (let i = 0; i < 15; i++) {
      promises.push(checkRateLimit('submission_wallet', TEST_WALLET))
    }
    
    const results = await Promise.all(promises)
    
    // First 10 should succeed, rest should fail
    const allowed = results.filter(r => r.allowed)
    const blocked = results.filter(r => !r.allowed)
    
    expect(allowed.length).toBe(10)
    expect(blocked.length).toBe(5)
  })
  
  it('should provide reset_at timestamp', async () => {
    const result = await checkRateLimit('submission_wallet', TEST_WALLET)
    
    expect(result.reset_at).toBeDefined()
    expect(result.reset_at).toBeInstanceOf(Date)
    expect(result.reset_at.getTime()).toBeGreaterThan(Date.now())
  })
})
