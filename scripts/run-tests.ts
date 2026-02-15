#!/usr/bin/env node
/**
 * WhiteClaws Test Runner
 * Runs test suites and generates summary
 */

import { spawn } from 'child_process'
import chalk from 'chalk'

const testSuites = [
  {
    name: 'Unit Tests: Referral Tree',
    path: 'tests/unit/referral-tree.test.ts',
    critical: true,
  },
  {
    name: 'Unit Tests: Bonus Calculation',
    path: 'tests/unit/bonus-calculation.test.ts',
    critical: true,
  },
  {
    name: 'Integration Tests: Registration',
    path: 'tests/integration/registration.test.ts',
    critical: true,
  },
]

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
}

async function runTest(suite: typeof testSuites[0]): Promise<TestResult> {
  const startTime = Date.now()
  
  return new Promise((resolve) => {
    const jest = spawn('npx', ['jest', suite.path, '--verbose'], {
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
    })
    
    jest.on('close', (code) => {
      const duration = Date.now() - startTime
      resolve({
        name: suite.name,
        passed: code === 0,
        duration,
      })
    })
    
    jest.on('error', (error) => {
      resolve({
        name: suite.name,
        passed: false,
        duration: Date.now() - startTime,
        error: error.message,
      })
    })
  })
}

async function main() {
  console.log(chalk.blue.bold('\n🧪 WhiteClaws Multi-Level Referral System Test Suite\n'))
  console.log(chalk.gray('━'.repeat(60)))
  
  const results: TestResult[] = []
  
  for (const suite of testSuites) {
    console.log(chalk.cyan(`\n▶ Running: ${suite.name}`))
    
    const result = await runTest(suite)
    results.push(result)
    
    if (result.passed) {
      console.log(chalk.green(`✓ ${suite.name} passed (${result.duration}ms)`))
    } else {
      console.log(chalk.red(`✗ ${suite.name} failed`))
      if (result.error) {
        console.log(chalk.red(`  Error: ${result.error}`))
      }
    }
  }
  
  // Summary
  console.log(chalk.gray('\n' + '━'.repeat(60)))
  console.log(chalk.blue.bold('\n📊 Test Summary\n'))
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => r.passed).length
  const total = results.length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  
  console.log(`Total: ${total} suites`)
  console.log(chalk.green(`Passed: ${passed}`))
  console.log(failed > 0 ? chalk.red(`Failed: ${failed}`) : chalk.gray(`Failed: 0`))
  console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`)
  
  // Critical failures
  const criticalFailures = results.filter(r => !r.passed && testSuites.find(s => s.name === r.name)?.critical)
  
  if (criticalFailures.length > 0) {
    console.log(chalk.red.bold('\n⚠️  Critical Test Failures:'))
    criticalFailures.forEach(f => {
      console.log(chalk.red(`  • ${f.name}`))
    })
    console.log(chalk.yellow('\n⛔ Cannot proceed to deployment with critical failures\n'))
    process.exit(1)
  }
  
  if (passed === total) {
    console.log(chalk.green.bold('\n✅ All tests passed! Ready for deployment.\n'))
    process.exit(0)
  } else {
    console.log(chalk.yellow.bold('\n⚠️  Some tests failed. Review before deployment.\n'))
    process.exit(1)
  }
}

main().catch(error => {
  console.error(chalk.red('Test runner error:'), error)
  process.exit(1)
})
