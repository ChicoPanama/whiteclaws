#!/usr/bin/env node
/**
 * WhiteClaws Complete Deployment Workflow
 * Orchestrates the entire deployment process from feature branch to production
 */

import { spawn } from 'child_process'
import chalk from 'chalk'
import fs from 'fs'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function runCommand(command: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
    })
    
    proc.on('close', (code) => resolve(code === 0))
    proc.on('error', () => resolve(false))
  })
}

async function main() {
  console.log(chalk.blue.bold('\n🚀 WhiteClaws Deployment Workflow\n'))
  console.log(chalk.gray('This script will guide you through the complete deployment process.\n'))
  console.log(chalk.gray('━'.repeat(80)))
  
  // ==========================================
  // STEP 1: Create Feature Branch
  // ==========================================
  
  console.log(chalk.cyan.bold('\n📌 Step 1: Create Feature Branch\n'))
  
  const branchName = 'feature/multi-level-referrals'
  console.log(chalk.gray(`Creating branch: ${branchName}`))
  
  const createBranch = await runCommand('git', ['checkout', '-b', branchName])
  
  if (!createBranch) {
    console.log(chalk.yellow('Branch may already exist. Switching to it...'))
    await runCommand('git', ['checkout', branchName])
  }
  
  console.log(chalk.green('✓ Feature branch ready'))
  
  // ==========================================
  // STEP 2: Pre-commit Checks
  // ==========================================
  
  console.log(chalk.cyan.bold('\n🔍 Step 2: Pre-commit Checks\n'))
  
  console.log(chalk.gray('Running TypeScript compilation...'))
  const tscCheck = await runCommand('npx', ['tsc', '--noEmit'])
  
  if (!tscCheck) {
    console.log(chalk.red('\n❌ TypeScript errors detected'))
    console.log(chalk.red('Fix TypeScript errors before proceeding.\n'))
    process.exit(1)
  }
  
  console.log(chalk.green('✓ TypeScript compilation passed'))
  
  console.log(chalk.gray('\nVerifying Supabase integration...'))
  const supabaseCheck = await runCommand('tsx', ['scripts/verify-supabase-integration.ts'])
  
  if (!supabaseCheck) {
    console.log(chalk.red('\n❌ Supabase verification failed'))
    console.log(chalk.red('Fix database issues before proceeding.\n'))
    process.exit(1)
  }
  
  console.log(chalk.green('✓ Supabase integration verified'))
  
  console.log(chalk.gray('\nRunning full test suite...'))
  const testsCheck = await runCommand('tsx', ['scripts/run-full-test-suite.ts'])
  
  if (!testsCheck) {
    console.log(chalk.red('\n❌ Tests failed'))
    console.log(chalk.red('Fix failing tests before proceeding.\n'))
    process.exit(1)
  }
  
  console.log(chalk.green('✓ All tests passed'))
  
  console.log(chalk.gray('\nChecking database integrity...'))
  const dbCheck = await runCommand('tsx', ['scripts/check-database-integrity.ts'])
  
  if (!dbCheck) {
    console.log(chalk.red('\n❌ Database integrity check failed'))
    console.log(chalk.red('Fix database issues before proceeding.\n'))
    process.exit(1)
  }
  
  console.log(chalk.green('✓ Database integrity verified'))
  
  // ==========================================
  // STEP 3: Commit Changes
  // ==========================================
  
  console.log(chalk.cyan.bold('\n💾 Step 3: Commit Changes\n'))
  
  await runCommand('git', ['add', '.'])
  
  const commitMessage = `feat: Multi-level referral system (L1-L5)

- Implemented 5-level referral tree (10%, 5%, 2.5%, 1%, 0.5% bonuses)
- Added wallet-based authentication with signature verification
- Implemented comprehensive anti-Sybil measures
- Added quality gates for submission verification
- Created rate limiting system
- Full test coverage (unit, integration, security)
- Comprehensive documentation

Verified:
- All tests passing
- Database integrity confirmed
- TypeScript compilation clean
- Supabase integration working
`
  
  await runCommand('git', ['commit', '-m', commitMessage])
  
  console.log(chalk.green('✓ Changes committed'))
  
  // ==========================================
  // STEP 4: Push to Remote
  // ==========================================
  
  console.log(chalk.cyan.bold('\n📤 Step 4: Push to Remote\n'))
  
  console.log(chalk.gray(`Pushing ${branchName} to origin...`))
  
  const pushSuccess = await runCommand('git', ['push', '-u', 'origin', branchName])
  
  if (!pushSuccess) {
    console.log(chalk.red('\n❌ Push failed'))
    console.log(chalk.yellow('You may need to set up authentication or resolve conflicts.\n'))
    process.exit(1)
  }
  
  console.log(chalk.green('✓ Pushed to remote'))
  
  // ==========================================
  // STEP 5: Merge to Main (with confirmation)
  // ==========================================
  
  console.log(chalk.cyan.bold('\n🔀 Step 5: Merge to Main\n'))
  
  const shouldMerge = await question(
    chalk.yellow('Ready to merge to main and deploy? (yes/no): ')
  )
  
  if (shouldMerge.toLowerCase() !== 'yes') {
    console.log(chalk.yellow('\n⏸️  Deployment paused'))
    console.log(chalk.gray('\nTo resume later:'))
    console.log(chalk.gray(`1. git checkout main`))
    console.log(chalk.gray(`2. git merge ${branchName}`))
    console.log(chalk.gray(`3. git push origin main\n`))
    rl.close()
    process.exit(0)
  }
  
  console.log(chalk.gray('\nSwitching to main branch...'))
  await runCommand('git', ['checkout', 'main'])
  
  console.log(chalk.gray('Pulling latest changes...'))
  await runCommand('git', ['pull', 'origin', 'main'])
  
  console.log(chalk.gray(`Merging ${branchName}...`))
  const mergeSuccess = await runCommand('git', ['merge', branchName])
  
  if (!mergeSuccess) {
    console.log(chalk.red('\n❌ Merge failed'))
    console.log(chalk.yellow('Resolve merge conflicts manually.\n'))
    process.exit(1)
  }
  
  console.log(chalk.green('✓ Merged to main'))
  
  console.log(chalk.gray('Pushing main to remote...'))
  await runCommand('git', ['push', 'origin', 'main'])
  
  console.log(chalk.green('✓ Main branch updated'))
  
  // ==========================================
  // STEP 6: Vercel Deployment
  // ==========================================
  
  console.log(chalk.cyan.bold('\n🌐 Step 6: Vercel Deployment\n'))
  
  console.log(chalk.gray('Vercel will auto-deploy from main branch.'))
  console.log(chalk.gray('Monitor deployment at: https://vercel.com/dashboard\n'))
  
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    branch: branchName,
    commit_message: commitMessage,
    deployed_to: 'production',
    status: 'pending_vercel',
  }
  
  fs.writeFileSync(
    'deployment-production.json',
    JSON.stringify(deploymentInfo, null, 2)
  )
  
  // ==========================================
  // SUMMARY
  // ==========================================
  
  console.log(chalk.gray('━'.repeat(80)))
  console.log(chalk.green.bold('\n✅ DEPLOYMENT WORKFLOW COMPLETE\n'))
  
  console.log(chalk.green('What was deployed:'))
  console.log(chalk.gray('  • Multi-level referral system (L1-L5)'))
  console.log(chalk.gray('  • Wallet-based authentication'))
  console.log(chalk.gray('  • Anti-Sybil measures'))
  console.log(chalk.gray('  • Quality gates'))
  console.log(chalk.gray('  • Rate limiting'))
  console.log(chalk.gray('  • Comprehensive tests & docs'))
  
  console.log(chalk.blue.bold('\n📋 Post-Deployment Tasks:\n'))
  console.log(chalk.gray('1. Monitor Vercel deployment'))
  console.log(chalk.gray('2. Run smoke tests on production'))
  console.log(chalk.gray('3. Verify health check endpoint'))
  console.log(chalk.gray('4. Check error logs for first hour'))
  console.log(chalk.gray('5. Monitor user registrations'))
  console.log(chalk.gray('6. Watch for Sybil activity'))
  
  console.log(chalk.blue.bold('\n🔗 Quick Links:\n'))
  console.log(chalk.gray('Production: https://whiteclaws.xyz'))
  console.log(chalk.gray('Vercel Dashboard: https://vercel.com/dashboard'))
  console.log(chalk.gray('Supabase Dashboard: https://supabase.com/dashboard'))
  console.log(chalk.gray('GitHub: https://github.com/WhiteRabbitLobster/whiteclaws'))
  
  console.log(chalk.green.bold('\n🎉 Congratulations! System is deployed.\n'))
  
  rl.close()
  process.exit(0)
}

main().catch(error => {
  console.error(chalk.red('Deployment error:'), error)
  rl.close()
  process.exit(1)
})
