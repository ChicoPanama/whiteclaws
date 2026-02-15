#!/usr/bin/env node
/**
 * WhiteClaws Staging Deployment Script
 * Deploys to Vercel staging environment with verification
 */

import { spawn } from 'child_process'
import chalk from 'chalk'
import fs from 'fs'

interface DeploymentStep {
  name: string
  command: string
  args: string[]
  critical: boolean
}

const DEPLOYMENT_STEPS: DeploymentStep[] = [
  {
    name: 'Pre-flight: Run tests',
    command: 'npm',
    args: ['run', 'test'],
    critical: true,
  },
  {
    name: 'Pre-flight: Check database integrity',
    command: 'tsx',
    args: ['scripts/check-database-integrity.ts'],
    critical: true,
  },
  {
    name: 'Pre-flight: TypeScript compilation',
    command: 'npx',
    args: ['tsc', '--noEmit'],
    critical: true,
  },
  {
    name: 'Build: Next.js production build',
    command: 'npm',
    args: ['run', 'build'],
    critical: true,
  },
  {
    name: 'Deploy: Vercel staging',
    command: 'vercel',
    args: ['--yes', '--env=staging'],
    critical: true,
  },
]

async function runStep(step: DeploymentStep): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(chalk.cyan(`\n▶ ${step.name}...`))
    
    const proc = spawn(step.command, step.args, {
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
    })
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`✓ ${step.name} completed`))
        resolve(true)
      } else {
        console.log(chalk.red(`✗ ${step.name} failed with code ${code}`))
        resolve(false)
      }
    })
    
    proc.on('error', (error) => {
      console.log(chalk.red(`✗ ${step.name} error: ${error.message}`))
      resolve(false)
    })
  })
}

async function verifyDeployment(url: string): Promise<boolean> {
  console.log(chalk.cyan(`\n▶ Verifying deployment at ${url}...`))
  
  try {
    // Health check
    const healthResponse = await fetch(`${url}/api/health`)
    if (!healthResponse.ok) {
      console.log(chalk.red('✗ Health check failed'))
      return false
    }
    
    const healthData = await healthResponse.json()
    console.log(chalk.green('✓ Health check passed'))
    console.log(chalk.gray(`  Status: ${healthData.status}`))
    console.log(chalk.gray(`  Database: ${healthData.database ? 'Connected' : 'Disconnected'}`))
    
    // Test registration endpoint
    const testWallet = '0xtest' + Math.random().toString(36).substring(2, 42).padEnd(40, '0')
    const regResponse = await fetch(`${url}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: `test-${Date.now()}`,
        name: 'Staging Test Agent',
        wallet_address: testWallet,
      }),
    })
    
    if (regResponse.status === 201) {
      console.log(chalk.green('✓ Registration endpoint working'))
      
      // Cleanup test user
      const regData = await regResponse.json()
      // TODO: Delete test user via admin API
    } else {
      console.log(chalk.yellow(`⚠ Registration endpoint returned ${regResponse.status}`))
    }
    
    return true
  } catch (error: any) {
    console.log(chalk.red(`✗ Verification failed: ${error.message}`))
    return false
  }
}

async function main() {
  console.log(chalk.blue.bold('\n🚀 WhiteClaws Staging Deployment\n'))
  console.log(chalk.gray('Deploying to Vercel staging environment...\n'))
  console.log(chalk.gray('━'.repeat(80)))
  
  // Check prerequisites
  console.log(chalk.cyan('\n▶ Checking prerequisites...'))
  
  if (!fs.existsSync('.env.local')) {
    console.log(chalk.red('✗ .env.local not found'))
    console.log(chalk.yellow('Create .env.local with required environment variables'))
    process.exit(1)
  }
  
  console.log(chalk.green('✓ Prerequisites OK'))
  
  // Run deployment steps
  for (const step of DEPLOYMENT_STEPS) {
    const success = await runStep(step)
    
    if (!success && step.critical) {
      console.log(chalk.red.bold('\n❌ DEPLOYMENT FAILED\n'))
      console.log(chalk.red(`Critical step "${step.name}" failed.`))
      console.log(chalk.yellow('Fix the error and try again.\n'))
      process.exit(1)
    }
  }
  
  // Extract deployment URL from Vercel output
  // In production, parse Vercel CLI output to get URL
  const stagingUrl = process.env.VERCEL_STAGING_URL || 'https://staging.whiteclaws.xyz'
  
  // Verify deployment
  const verified = await verifyDeployment(stagingUrl)
  
  // Summary
  console.log(chalk.gray('\n' + '━'.repeat(80)))
  
  if (verified) {
    console.log(chalk.green.bold('\n✅ STAGING DEPLOYMENT SUCCESSFUL\n'))
    console.log(chalk.green(`Deployment URL: ${stagingUrl}`))
    console.log(chalk.gray('\nNext steps:'))
    console.log(chalk.gray('1. Test manually in staging'))
    console.log(chalk.gray('2. Run smoke tests'))
    console.log(chalk.gray('3. Monitor for 24-48 hours'))
    console.log(chalk.gray('4. Deploy to production\n'))
    
    // Save deployment info
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      url: stagingUrl,
      environment: 'staging',
      status: 'success',
    }
    
    fs.writeFileSync(
      'deployment-staging.json',
      JSON.stringify(deploymentInfo, null, 2)
    )
    
    console.log(chalk.gray('Deployment info saved to: deployment-staging.json\n'))
    process.exit(0)
  } else {
    console.log(chalk.yellow.bold('\n⚠️ DEPLOYMENT COMPLETED WITH WARNINGS\n'))
    console.log(chalk.yellow('Deployment succeeded but verification had issues.'))
    console.log(chalk.yellow('Check the deployment manually before proceeding.\n'))
    process.exit(1)
  }
}

main().catch(error => {
  console.error(chalk.red('Deployment error:'), error)
  process.exit(1)
})
