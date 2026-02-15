#!/usr/bin/env node
/**
 * WhiteClaws Pre-Deployment Test Suite
 * Runs all tests with coverage requirements
 */

import { spawn } from 'child_process'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'

interface TestSuite {
  name: string
  path: string
  critical: boolean
  minCoverage?: number
}

interface TestResult {
  name: string
  passed: boolean
  duration: number
  coverage?: number
  error?: string
}

const TEST_SUITES: TestSuite[] = [
  // Unit Tests
  {
    name: 'Unit: Referral Tree Builder',
    path: 'tests/unit/referral-tree.test.ts',
    critical: true,
    minCoverage: 80,
  },
  {
    name: 'Unit: Bonus Calculation',
    path: 'tests/unit/bonus-calculation.test.ts',
    critical: true,
    minCoverage: 80,
  },
  
  // Integration Tests
  {
    name: 'Integration: Registration Flow',
    path: 'tests/integration/registration.test.ts',
    critical: true,
    minCoverage: 70,
  },
  
  // Security Tests
  {
    name: 'Security: SQL Injection Prevention',
    path: 'tests/security/sql-injection.test.ts',
    critical: true,
    minCoverage: 85,
  },
  {
    name: 'Security: Signature Replay Protection',
    path: 'tests/security/signature-replay.test.ts',
    critical: true,
    minCoverage: 85,
  },
  {
    name: 'Security: Permission & Access Control',
    path: 'tests/security/permissions.test.ts',
    critical: true,
    minCoverage: 75,
  },
  {
    name: 'Security: Rate Limiting',
    path: 'tests/security/rate-limiting.test.ts',
    critical: true,
    minCoverage: 80,
  },
]

async function runTest(suite: TestSuite): Promise<TestResult> {
  const startTime = Date.now()
  
  return new Promise((resolve) => {
    const args = [
      'jest',
      suite.path,
      '--coverage',
      '--coverageReporters=json-summary',
      '--verbose',
    ]
    
    const jest = spawn('npx', args, {
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '1' },
    })
    
    let output = ''
    
    jest.stdout?.on('data', (data) => {
      output += data.toString()
      process.stdout.write(data)
    })
    
    jest.stderr?.on('data', (data) => {
      output += data.toString()
      process.stderr.write(data)
    })
    
    jest.on('close', (code) => {
      const duration = Date.now() - startTime
      
      // Try to read coverage
      let coverage = 0
      try {
        const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json')
        if (fs.existsSync(coveragePath)) {
          const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'))
          const total = coverageData.total
          coverage = Math.round(
            (total.lines.pct + total.statements.pct + total.functions.pct + total.branches.pct) / 4
          )
        }
      } catch (err) {
        // Coverage not available
      }
      
      resolve({
        name: suite.name,
        passed: code === 0,
        duration,
        coverage,
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
  console.log(chalk.blue.bold('\n🧪 WhiteClaws Pre-Deployment Test Suite\n'))
  console.log(chalk.gray('Running all tests with coverage analysis...\n'))
  console.log(chalk.gray('━'.repeat(80)))
  
  const results: TestResult[] = []
  let totalDuration = 0
  
  // Run all test suites
  for (const suite of TEST_SUITES) {
    console.log(chalk.cyan(`\n▶ Running: ${suite.name}`))
    if (suite.minCoverage) {
      console.log(chalk.gray(`  Minimum coverage required: ${suite.minCoverage}%`))
    }
    
    const result = await runTest(suite)
    results.push(result)
    totalDuration += result.duration
    
    if (result.passed) {
      const coverageStatus = suite.minCoverage && result.coverage
        ? result.coverage >= suite.minCoverage
          ? chalk.green(`✓ ${result.coverage}%`)
          : chalk.red(`✗ ${result.coverage}% (below ${suite.minCoverage}%)`)
        : ''
      
      console.log(chalk.green(`✓ ${suite.name} passed (${result.duration}ms) ${coverageStatus}`))
    } else {
      console.log(chalk.red(`✗ ${suite.name} failed`))
      if (result.error) {
        console.log(chalk.red(`  Error: ${result.error}`))
      }
    }
  }
  
  // Summary
  console.log(chalk.gray('\n' + '━'.repeat(80)))
  console.log(chalk.blue.bold('\n📊 Test Summary\n'))
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length
  
  console.log(`Total Suites: ${total}`)
  console.log(chalk.green(`Passed: ${passed}`))
  console.log(failed > 0 ? chalk.red(`Failed: ${failed}`) : chalk.gray(`Failed: 0`))
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)
  
  // Coverage Summary
  const withCoverage = results.filter(r => r.coverage && r.coverage > 0)
  if (withCoverage.length > 0) {
    const avgCoverage = Math.round(
      withCoverage.reduce((sum, r) => sum + (r.coverage || 0), 0) / withCoverage.length
    )
    console.log(`Average Coverage: ${avgCoverage}%`)
  }
  
  // Coverage Requirements Check
  console.log(chalk.blue.bold('\n📈 Coverage Requirements\n'))
  
  const coverageFailures: string[] = []
  for (const suite of TEST_SUITES) {
    if (suite.minCoverage) {
      const result = results.find(r => r.name === suite.name)
      if (result?.coverage) {
        const met = result.coverage >= suite.minCoverage
        const status = met ? chalk.green('✓') : chalk.red('✗')
        console.log(
          `${status} ${suite.name}: ${result.coverage}% (min: ${suite.minCoverage}%)`
        )
        if (!met) {
          coverageFailures.push(suite.name)
        }
      }
    }
  }
  
  // Critical Failures
  const criticalFailures = results.filter(
    r => !r.passed && TEST_SUITES.find(s => s.name === r.name)?.critical
  )
  
  if (criticalFailures.length > 0) {
    console.log(chalk.red.bold('\n⚠️  Critical Test Failures:\n'))
    criticalFailures.forEach(f => {
      console.log(chalk.red(`  • ${f.name}`))
    })
  }
  
  if (coverageFailures.length > 0) {
    console.log(chalk.yellow.bold('\n⚠️  Coverage Requirements Not Met:\n'))
    coverageFailures.forEach(f => {
      console.log(chalk.yellow(`  • ${f}`))
    })
  }
  
  // Final Verdict
  console.log(chalk.gray('\n' + '━'.repeat(80)))
  
  if (passed === total && coverageFailures.length === 0) {
    console.log(chalk.green.bold('\n✅ ALL TESTS PASSED WITH REQUIRED COVERAGE\n'))
    console.log(chalk.green('System ready for deployment!\n'))
    
    // Generate test report
    const report = {
      timestamp: new Date().toISOString(),
      total_suites: total,
      passed: passed,
      failed: failed,
      duration_ms: totalDuration,
      results: results,
      status: 'PASS',
    }
    
    fs.writeFileSync(
      'test-report.json',
      JSON.stringify(report, null, 2)
    )
    
    console.log(chalk.gray('Test report saved to: test-report.json\n'))
    process.exit(0)
  } else {
    console.log(chalk.red.bold('\n❌ TESTS FAILED OR COVERAGE INSUFFICIENT\n'))
    
    if (criticalFailures.length > 0) {
      console.log(chalk.red('Critical tests must pass before deployment.\n'))
    }
    
    if (coverageFailures.length > 0) {
      console.log(chalk.yellow('Coverage requirements must be met before deployment.\n'))
    }
    
    // Generate failure report
    const report = {
      timestamp: new Date().toISOString(),
      total_suites: total,
      passed: passed,
      failed: failed,
      duration_ms: totalDuration,
      results: results,
      critical_failures: criticalFailures.map(f => f.name),
      coverage_failures: coverageFailures,
      status: 'FAIL',
    }
    
    fs.writeFileSync(
      'test-report.json',
      JSON.stringify(report, null, 2)
    )
    
    console.log(chalk.gray('Failure report saved to: test-report.json\n'))
    process.exit(1)
  }
}

main().catch(error => {
  console.error(chalk.red('Test runner error:'), error)
  process.exit(1)
})
