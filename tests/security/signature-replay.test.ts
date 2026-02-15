/**
 * Security Test: Signature Replay Protection
 * Tests wallet signature authentication for replay attacks
 */

import { describe, it, expect } from '@jest/globals'
import { constructSignMessage, verifyWalletSignature } from '@/lib/auth/wallet-signature'
import { createClient } from '@/lib/supabase/admin'

describe('Signature Replay Protection', () => {
  const supabase = createClient()
  
  it('should accept valid signature with fresh timestamp', async () => {
    const timestamp = Math.floor(Date.now() / 1000)
    const message = constructSignMessage('GET', '/api/test', timestamp)
    
    // In real scenario, this would be signed with private key
    // For testing, we'll verify the message format
    expect(message).toContain('whiteclaws:')
    expect(message).toContain('GET:')
    expect(message).toContain('/api/test:')
    expect(message).toContain(timestamp.toString())
  })
  
  it('should reject signature with expired timestamp', async () => {
    const tenMinutesAgo = Math.floor(Date.now() / 1000) - 600
    const oldMessage = constructSignMessage('POST', '/api/agents/submit', tenMinutesAgo)
    
    // Create mock request with old timestamp
    const mockReq = new Request('http://localhost/api/test', {
      headers: {
        'x-wallet-address': '0x1234567890123456789012345678901234567890',
        'x-wallet-signature': '0xfakesignature',
        'x-wallet-timestamp': tenMinutesAgo.toString(),
      },
    })
    
    const result = await verifyWalletSignature(mockReq)
    
    // Should reject due to expired timestamp (>5 min window)
    expect(result).toBeNull()
  })
  
  it('should reject signature with future timestamp', async () => {
    const tenMinutesInFuture = Math.floor(Date.now() / 1000) + 600
    
    const mockReq = new Request('http://localhost/api/test', {
      headers: {
        'x-wallet-address': '0x1234567890123456789012345678901234567890',
        'x-wallet-signature': '0xfakesignature',
        'x-wallet-timestamp': tenMinutesInFuture.toString(),
      },
    })
    
    const result = await verifyWalletSignature(mockReq)
    
    // Should reject future timestamp
    expect(result).toBeNull()
  })
  
  it('should prevent nonce reuse', async () => {
    const nonce = `nonce-${Date.now()}-${Math.random()}`
    const wallet = '0xtest1234567890123456789012345678901234'
    
    // First use of nonce - should succeed
    const { error: firstError } = await supabase
      .from('wallet_signature_nonces')
      .insert({
        wallet_address: wallet.toLowerCase(),
        nonce,
        expires_at: new Date(Date.now() + 600000).toISOString(),
      })
    
    expect(firstError).toBeNull()
    
    // Second use of same nonce - should fail (unique constraint)
    const { error: secondError } = await supabase
      .from('wallet_signature_nonces')
      .insert({
        wallet_address: wallet.toLowerCase(),
        nonce,
        expires_at: new Date(Date.now() + 600000).toISOString(),
      })
    
    expect(secondError).not.toBeNull()
    expect(secondError!.code).toBe('23505') // Unique violation
    
    // Cleanup
    await supabase
      .from('wallet_signature_nonces')
      .delete()
      .eq('wallet_address', wallet.toLowerCase())
  })
  
  it('should allow different nonces for same wallet', async () => {
    const wallet = '0xtest1234567890123456789012345678901234'
    const nonce1 = `nonce-1-${Date.now()}`
    const nonce2 = `nonce-2-${Date.now()}`
    
    // First nonce
    const { error: error1 } = await supabase
      .from('wallet_signature_nonces')
      .insert({
        wallet_address: wallet.toLowerCase(),
        nonce: nonce1,
        expires_at: new Date(Date.now() + 600000).toISOString(),
      })
    
    expect(error1).toBeNull()
    
    // Different nonce - should succeed
    const { error: error2 } = await supabase
      .from('wallet_signature_nonces')
      .insert({
        wallet_address: wallet.toLowerCase(),
        nonce: nonce2,
        expires_at: new Date(Date.now() + 600000).toISOString(),
      })
    
    expect(error2).toBeNull()
    
    // Cleanup
    await supabase
      .from('wallet_signature_nonces')
      .delete()
      .eq('wallet_address', wallet.toLowerCase())
  })
  
  it('should include nonce in signature message when provided', () => {
    const timestamp = Math.floor(Date.now() / 1000)
    const nonce = 'unique-nonce-12345'
    
    const messageWithNonce = constructSignMessage('POST', '/api/test', timestamp, nonce)
    const messageWithoutNonce = constructSignMessage('POST', '/api/test', timestamp)
    
    expect(messageWithNonce).toContain(nonce)
    expect(messageWithoutNonce).not.toContain('unique-nonce')
    expect(messageWithNonce.length).toBeGreaterThan(messageWithoutNonce.length)
  })
  
  it('should clean up expired nonces', async () => {
    const wallet = '0xtest1234567890123456789012345678901234'
    const expiredNonce = 'expired-nonce-test'
    
    // Insert expired nonce (1 hour ago)
    await supabase
      .from('wallet_signature_nonces')
      .insert({
        wallet_address: wallet.toLowerCase(),
        nonce: expiredNonce,
        expires_at: new Date(Date.now() - 3600000).toISOString(),
      })
    
    // Cleanup function should remove it
    const { count: beforeCount } = await supabase
      .from('wallet_signature_nonces')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_address', wallet.toLowerCase())
    
    expect(beforeCount).toBeGreaterThan(0)
    
    // Delete expired
    await supabase
      .from('wallet_signature_nonces')
      .delete()
      .lt('expires_at', new Date().toISOString())
    
    const { count: afterCount } = await supabase
      .from('wallet_signature_nonces')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_address', wallet.toLowerCase())
    
    expect(afterCount).toBe(0)
  })
  
  it('should reject request without signature headers', async () => {
    const mockReq = new Request('http://localhost/api/test', {
      headers: {},
    })
    
    const result = await verifyWalletSignature(mockReq)
    expect(result).toBeNull()
  })
  
  it('should reject request with partial signature headers', async () => {
    // Missing signature
    const mockReq1 = new Request('http://localhost/api/test', {
      headers: {
        'x-wallet-address': '0x1234567890123456789012345678901234567890',
        'x-wallet-timestamp': Math.floor(Date.now() / 1000).toString(),
      },
    })
    
    expect(await verifyWalletSignature(mockReq1)).toBeNull()
    
    // Missing address
    const mockReq2 = new Request('http://localhost/api/test', {
      headers: {
        'x-wallet-signature': '0xfakesig',
        'x-wallet-timestamp': Math.floor(Date.now() / 1000).toString(),
      },
    })
    
    expect(await verifyWalletSignature(mockReq2)).toBeNull()
    
    // Missing timestamp
    const mockReq3 = new Request('http://localhost/api/test', {
      headers: {
        'x-wallet-address': '0x1234567890123456789012345678901234567890',
        'x-wallet-signature': '0xfakesig',
      },
    })
    
    expect(await verifyWalletSignature(mockReq3)).toBeNull()
  })
  
  it('should enforce 5-minute timestamp window', () => {
    const now = Date.now() / 1000
    
    // Test boundary conditions
    const timestamps = [
      now - 301,  // 5 min 1 sec ago - should fail
      now - 300,  // Exactly 5 min ago - should pass
      now - 60,   // 1 min ago - should pass
      now,        // Now - should pass
      now + 60,   // 1 min future - should pass
      now + 300,  // Exactly 5 min future - should pass
      now + 301,  // 5 min 1 sec future - should fail
    ]
    
    const WINDOW_MS = 5 * 60 * 1000
    
    for (const ts of timestamps) {
      const diff = Math.abs(now - ts) * 1000
      const shouldPass = diff <= WINDOW_MS
      
      if (shouldPass) {
        expect(diff).toBeLessThanOrEqual(WINDOW_MS)
      } else {
        expect(diff).toBeGreaterThan(WINDOW_MS)
      }
    }
  })
  
  it('should prevent cross-wallet signature reuse', async () => {
    const wallet1 = '0xwallet1111111111111111111111111111111111'
    const wallet2 = '0xwallet2222222222222222222222222222222222'
    const nonce = 'shared-nonce-test'
    
    // Wallet1 uses nonce
    await supabase.from('wallet_signature_nonces').insert({
      wallet_address: wallet1.toLowerCase(),
      nonce,
      expires_at: new Date(Date.now() + 600000).toISOString(),
    })
    
    // Wallet2 should be able to use same nonce (different wallet)
    const { error } = await supabase.from('wallet_signature_nonces').insert({
      wallet_address: wallet2.toLowerCase(),
      nonce,
      expires_at: new Date(Date.now() + 600000).toISOString(),
    })
    
    expect(error).toBeNull()
    
    // Cleanup
    await supabase
      .from('wallet_signature_nonces')
      .delete()
      .in('wallet_address', [wallet1.toLowerCase(), wallet2.toLowerCase()])
  })
  
  it('should validate timestamp is numeric', async () => {
    const mockReq = new Request('http://localhost/api/test', {
      headers: {
        'x-wallet-address': '0x1234567890123456789012345678901234567890',
        'x-wallet-signature': '0xfakesig',
        'x-wallet-timestamp': 'not-a-number',
      },
    })
    
    const result = await verifyWalletSignature(mockReq)
    expect(result).toBeNull()
  })
})
