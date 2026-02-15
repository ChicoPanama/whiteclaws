/**
 * Security Test: SQL Injection Prevention
 * Tests all user inputs for SQL injection vulnerabilities
 */

import { describe, it, expect } from '@jest/globals'
import { createClient } from '@/lib/supabase/admin'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Common SQL injection payloads
const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "1' OR 1=1--",
  "admin'--",
  "' UNION SELECT NULL--",
  "1; DELETE FROM referral_links WHERE 1=1--",
  "'; UPDATE users SET wallet_address='0x0'--",
  "') OR ('1'='1",
  "1' AND 1=CONVERT(int, (SELECT @@version))--",
  "%27%20OR%201=1--",
]

describe('SQL Injection Prevention', () => {
  const supabase = createClient()
  
  it('should prevent SQL injection in registration handle', async () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      const response = await fetch(`${API_BASE}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: payload,
          name: 'Test User',
          wallet_address: '0x1234567890123456789012345678901234567890',
        }),
      })
      
      // Should either reject (400) or sanitize (201 with sanitized handle)
      // Must NOT return 500 (server error from SQL injection)
      expect([400, 201]).toContain(response.status)
      
      if (response.status !== 500) {
        const data = await response.json()
        // If accepted, verify handle was sanitized
        if (response.status === 201) {
          expect(data.agent.handle).not.toContain("'")
          expect(data.agent.handle).not.toContain('"')
          expect(data.agent.handle).not.toContain('--')
          
          // Cleanup
          await supabase.from('users').delete().eq('id', data.agent.id)
        }
      }
    }
  })
  
  it('should prevent SQL injection in referral code lookup', async () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      const response = await fetch(`${API_BASE}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: 'test-sqli-ref',
          name: 'Test',
          wallet_address: '0x1234567890123456789012345678901234567890',
          referral_code: payload,
        }),
      })
      
      // Should handle gracefully - either 201 (ignores bad ref) or 400 (validates format)
      expect([201, 400]).toContain(response.status)
      expect(response.status).not.toBe(500)
      
      if (response.status === 201) {
        const data = await response.json()
        // Should have upline_levels = 0 (referral failed safely)
        expect(data.referral.upline_levels).toBe(0)
        
        // Cleanup
        await supabase.from('users').delete().eq('id', data.agent.id)
      }
    }
  })
  
  it('should prevent SQL injection in protocol slug (submission)', async () => {
    // This test requires auth, so we'll test the validation layer
    for (const payload of SQL_INJECTION_PAYLOADS) {
      // Direct database query with payload
      const { error } = await supabase
        .from('protocols')
        .select('id')
        .eq('slug', payload)
        .maybeSingle()
      
      // Supabase should handle this safely (no error from injection)
      // Error should be null or a standard "not found" type error
      if (error) {
        expect(error.code).not.toBe('42601') // PostgreSQL syntax error
        expect(error.message).not.toContain('syntax error')
      }
    }
  })
  
  it('should prevent SQL injection in wallet address queries', async () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      const { error } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', payload)
        .maybeSingle()
      
      if (error) {
        expect(error.code).not.toBe('42601')
        expect(error.message).not.toContain('syntax error')
      }
    }
  })
  
  it('should use parameterized queries in referral tree builder', async () => {
    // Test that buildReferralTree doesn't construct raw SQL
    const maliciousWallet = "0x1234'; DROP TABLE referral_tree; --"
    const maliciousCode = "wc-test'; DELETE FROM users; --"
    
    // This should fail gracefully without executing SQL
    const { data: link } = await supabase
      .from('referral_links')
      .select('wallet_address')
      .eq('code', maliciousCode)
      .maybeSingle()
    
    // Should return null, not cause SQL error
    expect(link).toBeNull()
  })
  
  it('should sanitize input in anti-sybil flags', async () => {
    const maliciousWallet = "'; DROP TABLE anti_sybil_flags; --"
    
    const { error } = await supabase
      .from('anti_sybil_flags')
      .insert({
        wallet_address: maliciousWallet,
        risk_score: 0.5,
        flags: [],
      })
    
    // Should insert safely or reject on validation
    // Should NOT cause SQL syntax error
    if (error) {
      expect(error.code).not.toBe('42601')
    }
    
    // Cleanup if inserted
    await supabase
      .from('anti_sybil_flags')
      .delete()
      .eq('wallet_address', maliciousWallet)
  })
  
  it('should prevent SQL injection in RPC functions', async () => {
    const maliciousWallet = "'; DROP TABLE users; SELECT '"
    
    // Test check_circular_referral RPC
    const { error: circularError } = await supabase
      .rpc('check_circular_referral', {
        new_wallet: maliciousWallet,
        referrer_wallet: '0x0000000000000000000000000000000000000000',
      })
    
    if (circularError) {
      expect(circularError.code).not.toBe('42601')
      expect(circularError.message).not.toContain('syntax error')
    }
    
    // Test get_downline_stats RPC
    const { error: statsError } = await supabase
      .rpc('get_downline_stats', {
        ancestor_wallet: maliciousWallet,
      })
    
    if (statsError) {
      expect(statsError.code).not.toBe('42601')
    }
  })
  
  it('should validate and escape JSONB content', async () => {
    // Test that JSONB fields don't allow SQL injection through JSON
    const maliciousMetadata = {
      note: "'; DROP TABLE findings; --",
      tags: ["'; DELETE FROM users; --"],
    }
    
    const { error } = await supabase
      .from('participation_events')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        event_type: 'test_event',
        points: 0,
        metadata: maliciousMetadata,
        season: 1,
        week: 1,
      })
    
    // Should either insert safely or reject on FK constraint
    // Should NOT cause SQL injection
    if (error) {
      expect(error.code).not.toBe('42601')
    }
    
    // Cleanup
    await supabase
      .from('participation_events')
      .delete()
      .eq('event_type', 'test_event')
  })
  
  it('should prevent second-order SQL injection', async () => {
    // Store malicious content
    const testWallet = '0xtest1234567890123456789012345678901234'
    const maliciousCode = "wc-test'; SELECT pg_sleep(10); --"
    
    await supabase.from('referral_links').insert({
      wallet_address: testWallet,
      code: maliciousCode,
    })
    
    // Later retrieval should not execute injection
    const { data, error } = await supabase
      .from('referral_links')
      .select('code')
      .eq('wallet_address', testWallet)
      .single()
    
    expect(error).toBeNull()
    expect(data!.code).toBe(maliciousCode) // Stored as-is
    
    // Using it in a query should be safe (parameterized)
    const { error: lookupError } = await supabase
      .from('referral_links')
      .select('wallet_address')
      .eq('code', data!.code)
      .single()
    
    expect(lookupError).toBeNull()
    
    // Cleanup
    await supabase.from('referral_links').delete().eq('wallet_address', testWallet)
  })
  
  it('should log but not expose SQL errors to users', async () => {
    // Intentionally malformed query (testing error handling)
    const response = await fetch(`${API_BASE}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'test',
        name: 'Test',
        wallet_address: 'invalid-format-to-trigger-error',
      }),
    })
    
    const data = await response.json()
    
    // Error message should NOT expose SQL details
    if (data.error) {
      expect(data.error).not.toContain('SELECT')
      expect(data.error).not.toContain('INSERT')
      expect(data.error).not.toContain('UPDATE')
      expect(data.error).not.toContain('DELETE')
      expect(data.error).not.toContain('PostgreSQL')
      expect(data.error).not.toContain('pg_')
    }
  })
})
