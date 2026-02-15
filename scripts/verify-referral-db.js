#!/usr/bin/env node
/**
 * Database Verification Script
 * Checks multi-level referral system integrity
 * 
 * Usage: node scripts/verify-referral-db.js
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const tests = []

// Test 1: Tables exist
tests.push({
  name: 'Tables exist',
  run: async () => {
    const tables = ['referral_links', 'referral_tree', 'referral_bonuses']
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1)
      if (error) throw new Error(`Table ${table} not found: ${error.message}`)
    }
  }
})

// Test 2: Indexes exist
tests.push({
  name: 'Indexes exist',
  run: async () => {
    const { data, error } = await supabase.rpc('get_table_indexes', { 
      table_name: 'referral_tree' 
    }).catch(() => {
      // Fallback: manual query
      return supabase.from('pg_indexes')
        .select('indexname')
        .eq('tablename', 'referral_tree')
    })
    
    if (error) throw new Error(`Failed to check indexes: ${error.message}`)
    
    const requiredIndexes = [
      'idx_referral_tree_wallet',
      'idx_referral_tree_referrer',
      'idx_referral_tree_level',
    ]
    
    const indexNames = data?.map(d => d.indexname) || []
    for (const idx of requiredIndexes) {
      if (!indexNames.includes(idx)) {
        throw new Error(`Missing index: ${idx}`)
      }
    }
  }
})

// Test 3: Constraints work
tests.push({
  name: 'Constraints prevent bad data',
  run: async () => {
    // Test: Level must be 1-5
    const { error: levelError } = await supabase.from('referral_tree').insert({
      wallet_address: '0xtest',
      referrer_wallet: '0xreferrer',
      level: 6,  // Invalid
      upline_path: ['0xreferrer'],
    })
    if (!levelError) throw new Error('Level constraint failed')
    
    // Test: No self-referral
    const { error: selfError } = await supabase.from('referral_tree').insert({
      wallet_address: '0xsame',
      referrer_wallet: '0xsame',  // Same wallet
      level: 1,
      upline_path: ['0xsame'],
    })
    if (!selfError) throw new Error('Self-referral constraint failed')
  }
})

// Test 4: Functions exist
tests.push({
  name: 'Helper functions exist',
  run: async () => {
    // Test get_referral_tier_percentage
    const { data: tier1, error: tier1Error } = await supabase
      .rpc('get_referral_tier_percentage', { tier: 1 })
    if (tier1Error) throw new Error('get_referral_tier_percentage failed')
    if (tier1 !== 0.1) throw new Error(`Expected 0.1, got ${tier1}`)
    
    // Test get_downline_stats (should return empty for non-existent wallet)
    const { data: stats, error: statsError } = await supabase
      .rpc('get_downline_stats', { ancestor_wallet: '0xnonexistent' })
    if (statsError) throw new Error('get_downline_stats failed')
    
    // Test check_circular_referral
    const { data: circular, error: circularError } = await supabase
      .rpc('check_circular_referral', { 
        new_wallet: '0xtest1', 
        referrer_wallet: '0xtest2' 
      })
    if (circularError) throw new Error('check_circular_referral failed')
  }
})

// Test 5: Wallet lowercase enforcement
tests.push({
  name: 'Wallet addresses forced to lowercase',
  run: async () => {
    const testWallet = '0xABC123'  // Mixed case
    
    // Insert should convert to lowercase
    const { data, error } = await supabase.from('referral_links')
      .insert({ wallet_address: testWallet, code: 'wc-test99' })
      .select()
      .single()
    
    if (error) {
      // Cleanup and rethrow
      await supabase.from('referral_links').delete().eq('code', 'wc-test99')
      throw new Error(error.message)
    }
    
    if (data.wallet_address !== testWallet.toLowerCase()) {
      await supabase.from('referral_links').delete().eq('code', 'wc-test99')
      throw new Error(`Wallet not lowercased: ${data.wallet_address}`)
    }
    
    // Cleanup
    await supabase.from('referral_links').delete().eq('code', 'wc-test99')
  }
})

// Test 6: Data counts
tests.push({
  name: 'Data migration successful',
  run: async () => {
    const { count: linksCount } = await supabase
      .from('referral_links')
      .select('*', { count: 'exact', head: true })
    
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('wallet_address', 'is', null)
    
    console.log(`   Referral links: ${linksCount}`)
    console.log(`   Users with wallets: ${usersCount}`)
    
    if (linksCount === 0 && usersCount > 0) {
      throw new Error('Referral links not created for existing users')
    }
  }
})

// Run all tests
async function runTests() {
  console.log('🔍 WhiteClaws Referral System Database Verification\n')
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    process.stdout.write(`Testing: ${test.name}... `)
    try {
      await test.run()
      console.log('✅ PASS')
      passed++
    } catch (error) {
      console.log('❌ FAIL')
      console.error(`   Error: ${error.message}\n`)
      failed++
    }
  }
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
  
  if (failed > 0) {
    console.error('❌ Verification failed')
    process.exit(1)
  } else {
    console.log('✅ All checks passed')
    process.exit(0)
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
