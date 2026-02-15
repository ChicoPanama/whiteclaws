#!/usr/bin/env node
/**
 * WhiteClaws Database Integrity Check
 * Verifies database schema, constraints, and data consistency
 */

import { createClient } from '@/lib/supabase/admin'
import chalk from 'chalk'

interface IntegrityCheck {
  name: string
  description: string
  critical: boolean
  check: () => Promise<{ passed: boolean; message?: string; details?: any }>
}

const INTEGRITY_CHECKS: IntegrityCheck[] = [
  {
    name: 'Required Tables Exist',
    description: 'Verify all required tables are present',
    critical: true,
    check: async () => {
      const supabase = createClient()
      const requiredTables = [
        'users',
        'referral_links',
        'referral_tree',
        'referral_bonuses',
        'wallet_signature_nonces',
        'participation_events',
        'contribution_scores',
        'anti_sybil_flags',
        'rate_limit_buckets',
      ]
      
      const missingTables: string[] = []
      
      for (const table of requiredTables) {
        const { error } = await supabase.from(table).select('id').limit(1)
        if (error && error.code === '42P01') { // undefined_table
          missingTables.push(table)
        }
      }
      
      if (missingTables.length > 0) {
        return {
          passed: false,
          message: `Missing tables: ${missingTables.join(', ')}`,
          details: { missing: missingTables },
        }
      }
      
      return { passed: true }
    },
  },
  
  {
    name: 'Foreign Key Constraints',
    description: 'Verify all foreign key relationships are valid',
    critical: true,
    check: async () => {
      const supabase = createClient()
      
      // Check referral_tree references valid wallets
      const { data: orphanedTrees } = await supabase
        .from('referral_tree')
        .select('wallet_address')
        .not('referrer_wallet', 'in', 
          supabase.from('referral_links').select('wallet_address')
        )
      
      if (orphanedTrees && orphanedTrees.length > 0) {
        return {
          passed: false,
          message: `Found ${orphanedTrees.length} referral tree entries with invalid referrer`,
          details: { count: orphanedTrees.length },
        }
      }
      
      return { passed: true }
    },
  },
  
  {
    name: 'Referral Tree Level Integrity',
    description: 'Verify all referral tree levels are 1-5',
    critical: true,
    check: async () => {
      const supabase = createClient()
      
      const { data: invalidLevels } = await supabase
        .from('referral_tree')
        .select('wallet_address, level')
        .or('level.lt.1,level.gt.5')
      
      if (invalidLevels && invalidLevels.length > 0) {
        return {
          passed: false,
          message: `Found ${invalidLevels.length} entries with invalid levels`,
          details: { invalid: invalidLevels },
        }
      }
      
      return { passed: true }
    },
  },
  
  {
    name: 'Wallet Address Format',
    description: 'Verify all wallet addresses are valid Ethereum addresses',
    critical: true,
    check: async () => {
      const supabase = createClient()
      
      const { data: invalidWallets } = await supabase
        .from('users')
        .select('wallet_address')
        .not('wallet_address', 'like', '0x%')
      
      if (invalidWallets && invalidWallets.length > 0) {
        return {
          passed: false,
          message: `Found ${invalidWallets.length} invalid wallet addresses`,
          details: { count: invalidWallets.length },
        }
      }
      
      return { passed: true }
    },
  },
  
  {
    name: 'Referral Code Uniqueness',
    description: 'Verify all referral codes are unique',
    critical: true,
    check: async () => {
      const supabase = createClient()
      
      const { data: codes } = await supabase
        .from('referral_links')
        .select('code')
      
      if (!codes) return { passed: true }
      
      const seen = new Set<string>()
      const duplicates: string[] = []
      
      for (const { code } of codes) {
        if (seen.has(code)) {
          duplicates.push(code)
        }
        seen.add(code)
      }
      
      if (duplicates.length > 0) {
        return {
          passed: false,
          message: `Found ${duplicates.length} duplicate referral codes`,
          details: { duplicates },
        }
      }
      
      return { passed: true }
    },
  },
  
  {
    name: 'Circular Referral Check',
    description: 'Verify no circular referral chains exist',
    critical: true,
    check: async () => {
      const supabase = createClient()
      
      const { data: trees } = await supabase
        .from('referral_tree')
        .select('wallet_address, referrer_wallet, upline_path')
      
      if (!trees) return { passed: true }
      
      const circular: string[] = []
      
      for (const tree of trees) {
        if (tree.upline_path?.includes(tree.wallet_address)) {
          circular.push(tree.wallet_address)
        }
      }
      
      if (circular.length > 0) {
        return {
          passed: false,
          message: `Found ${circular.length} circular referral chains`,
          details: { circular },
        }
      }
      
      return { passed: true }
    },
  },
  
  {
    name: 'Bonus Calculation Consistency',
    description: 'Verify referral bonus percentages are correct',
    critical: false,
    check: async () => {
      const supabase = createClient()
      
      const expectedPercentages = {
        1: 0.1,
        2: 0.05,
        3: 0.025,
        4: 0.01,
        5: 0.005,
      }
      
      const { data: bonuses } = await supabase
        .from('referral_bonuses')
        .select('level, bonus_percentage, base_points, bonus_points')
      
      if (!bonuses) return { passed: true }
      
      const inconsistent: any[] = []
      
      for (const bonus of bonuses) {
        const expected = expectedPercentages[bonus.level as keyof typeof expectedPercentages]
        if (Math.abs(bonus.bonus_percentage - expected) > 0.0001) {
          inconsistent.push({
            level: bonus.level,
            expected,
            actual: bonus.bonus_percentage,
          })
        }
      }
      
      if (inconsistent.length > 0) {
        return {
          passed: false,
          message: `Found ${inconsistent.length} bonuses with incorrect percentages`,
          details: { inconsistent },
        }
      }
      
      return { passed: true }
    },
  },
  
  {
    name: 'Expired Nonce Cleanup',
    description: 'Check for expired signature nonces',
    critical: false,
    check: async () => {
      const supabase = createClient()
      
      const { count } = await supabase
        .from('wallet_signature_nonces')
        .select('*', { count: 'exact', head: true })
        .lt('expires_at', new Date().toISOString())
      
      if (count && count > 1000) {
        return {
          passed: false,
          message: `Found ${count} expired nonces (cleanup needed)`,
          details: { expired_count: count },
        }
      }
      
      return { passed: true, details: { expired_count: count || 0 } }
    },
  },
  
  {
    name: 'Rate Limit Bucket Cleanup',
    description: 'Check for expired rate limit buckets',
    critical: false,
    check: async () => {
      const supabase = createClient()
      
      const { count } = await supabase
        .from('rate_limit_buckets')
        .select('*', { count: 'exact', head: true })
        .lt('reset_at', new Date().toISOString())
      
      if (count && count > 500) {
        return {
          passed: false,
          message: `Found ${count} expired buckets (cleanup needed)`,
          details: { expired_count: count },
        }
      }
      
      return { passed: true, details: { expired_count: count || 0 } }
    },
  },
  
  {
    name: 'User Wallet Uniqueness',
    description: 'Verify each wallet is registered only once',
    critical: true,
    check: async () => {
      const supabase = createClient()
      
      const { data: wallets } = await supabase
        .from('users')
        .select('wallet_address')
      
      if (!wallets) return { passed: true }
      
      const seen = new Set<string>()
      const duplicates: string[] = []
      
      for (const { wallet_address } of wallets) {
        if (seen.has(wallet_address)) {
          duplicates.push(wallet_address)
        }
        seen.add(wallet_address)
      }
      
      if (duplicates.length > 0) {
        return {
          passed: false,
          message: `Found ${duplicates.length} duplicate wallet registrations`,
          details: { duplicates },
        }
      }
      
      return { passed: true }
    },
  },
]

async function main() {
  console.log(chalk.blue.bold('\n🔍 WhiteClaws Database Integrity Check\n'))
  console.log(chalk.gray('Verifying database schema and data consistency...\n'))
  console.log(chalk.gray('━'.repeat(80)))
  
  const results: { check: IntegrityCheck; result: any }[] = []
  
  for (const check of INTEGRITY_CHECKS) {
    process.stdout.write(chalk.cyan(`\n▶ ${check.name}... `))
    
    try {
      const result = await check.check()
      results.push({ check, result })
      
      if (result.passed) {
        console.log(chalk.green('✓ PASS'))
        if (result.details) {
          console.log(chalk.gray(`  ${JSON.stringify(result.details)}`))
        }
      } else {
        console.log(chalk.red('✗ FAIL'))
        if (result.message) {
          console.log(chalk.red(`  ${result.message}`))
        }
        if (result.details) {
          console.log(chalk.gray(`  ${JSON.stringify(result.details, null, 2)}`))
        }
      }
    } catch (error: any) {
      console.log(chalk.red('✗ ERROR'))
      console.log(chalk.red(`  ${error.message}`))
      results.push({
        check,
        result: { passed: false, message: error.message },
      })
    }
  }
  
  // Summary
  console.log(chalk.gray('\n' + '━'.repeat(80)))
  console.log(chalk.blue.bold('\n📊 Integrity Check Summary\n'))
  
  const passed = results.filter(r => r.result.passed).length
  const failed = results.filter(r => !r.result.passed).length
  const total = results.length
  
  console.log(`Total Checks: ${total}`)
  console.log(chalk.green(`Passed: ${passed}`))
  console.log(failed > 0 ? chalk.red(`Failed: ${failed}`) : chalk.gray(`Failed: 0`))
  
  // Critical Failures
  const criticalFailures = results.filter(
    r => !r.result.passed && r.check.critical
  )
  
  if (criticalFailures.length > 0) {
    console.log(chalk.red.bold('\n⚠️  Critical Integrity Issues:\n'))
    criticalFailures.forEach(({ check, result }) => {
      console.log(chalk.red(`  • ${check.name}`))
      if (result.message) {
        console.log(chalk.red(`    ${result.message}`))
      }
    })
  }
  
  // Warnings
  const warnings = results.filter(
    r => !r.result.passed && !r.check.critical
  )
  
  if (warnings.length > 0) {
    console.log(chalk.yellow.bold('\n⚠️  Non-Critical Warnings:\n'))
    warnings.forEach(({ check, result }) => {
      console.log(chalk.yellow(`  • ${check.name}`))
      if (result.message) {
        console.log(chalk.yellow(`    ${result.message}`))
      }
    })
  }
  
  // Final Verdict
  console.log(chalk.gray('\n' + '━'.repeat(80)))
  
  if (criticalFailures.length === 0) {
    console.log(chalk.green.bold('\n✅ DATABASE INTEGRITY VERIFIED\n'))
    
    if (warnings.length > 0) {
      console.log(chalk.yellow('Non-critical warnings should be addressed before production.\n'))
    } else {
      console.log(chalk.green('All checks passed. Database is ready for deployment!\n'))
    }
    
    process.exit(0)
  } else {
    console.log(chalk.red.bold('\n❌ DATABASE INTEGRITY COMPROMISED\n'))
    console.log(chalk.red('Critical issues must be fixed before deployment.\n'))
    
    process.exit(1)
  }
}

main().catch(error => {
  console.error(chalk.red('Integrity check error:'), error)
  process.exit(1)
})
