#!/usr/bin/env node
/**
 * WhiteClaws Performance Benchmarks
 * Tests API response times and database query performance
 */

import chalk from 'chalk'

interface Benchmark {
  name: string
  description: string
  maxTime: number // milliseconds
  run: () => Promise<number>
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const TEST_API_KEY = process.env.TEST_API_KEY || ''

const BENCHMARKS: Benchmark[] = [
  {
    name: 'Registration Endpoint',
    description: 'POST /api/agents/register',
    maxTime: 500,
    run: async () => {
      const start = Date.now()
      
      const wallet = '0xbench' + Math.random().toString(36).substring(2, 42).padEnd(38, '0')
      
      const response = await fetch(`${API_BASE}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: `bench-${Date.now()}`,
          name: 'Benchmark Test',
          wallet_address: wallet,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status}`)
      }
      
      return Date.now() - start
    },
  },
  
  {
    name: 'Referral Code Lookup',
    description: 'GET /api/referral/code',
    maxTime: 200,
    run: async () => {
      if (!TEST_API_KEY) {
        console.log(chalk.yellow('  Skipped (no TEST_API_KEY)'))
        return 0
      }
      
      const start = Date.now()
      
      const response = await fetch(`${API_BASE}/api/referral/code`, {
        headers: { 'Authorization': `Bearer ${TEST_API_KEY}` },
      })
      
      if (!response.ok) {
        throw new Error(`Lookup failed: ${response.status}`)
      }
      
      return Date.now() - start
    },
  },
  
  {
    name: 'Referral Network Query',
    description: 'GET /api/referral/network',
    maxTime: 1000,
    run: async () => {
      if (!TEST_API_KEY) {
        console.log(chalk.yellow('  Skipped (no TEST_API_KEY)'))
        return 0
      }
      
      const start = Date.now()
      
      const response = await fetch(`${API_BASE}/api/referral/network?season=1`, {
        headers: { 'Authorization': `Bearer ${TEST_API_KEY}` },
      })
      
      if (!response.ok) {
        throw new Error(`Network query failed: ${response.status}`)
      }
      
      return Date.now() - start
    },
  },
  
  {
    name: 'Points Leaderboard',
    description: 'GET /api/points/leaderboard',
    maxTime: 800,
    run: async () => {
      const start = Date.now()
      
      const response = await fetch(`${API_BASE}/api/points/leaderboard?season=1&limit=100`)
      
      if (!response.ok) {
        throw new Error(`Leaderboard failed: ${response.status}`)
      }
      
      return Date.now() - start
    },
  },
  
  {
    name: 'Tree Builder Performance',
    description: 'Referral tree creation (5 levels)',
    maxTime: 2000,
    run: async () => {
      const start = Date.now()
      
      // Simulate building a 5-level tree
      const wallets = []
      for (let i = 0; i < 5; i++) {
        const wallet = '0xperf' + i + Math.random().toString(36).substring(2, 40).padEnd(36, '0')
        wallets.push(wallet)
      }
      
      let referralCode = ''
      
      for (let i = 0; i < 5; i++) {
        const response = await fetch(`${API_BASE}/api/agents/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            handle: `tree-${Date.now()}-${i}`,
            name: `Tree Test ${i}`,
            wallet_address: wallets[i],
            referral_code: referralCode || undefined,
          }),
        })
        
        if (response.ok) {
          const data = await response.json()
          referralCode = data.referral.code
        }
      }
      
      return Date.now() - start
    },
  },
  
  {
    name: 'Concurrent Registrations',
    description: '10 parallel registration requests',
    maxTime: 3000,
    run: async () => {
      const start = Date.now()
      
      const promises = []
      for (let i = 0; i < 10; i++) {
        const wallet = '0xconc' + i + Math.random().toString(36).substring(2, 39).padEnd(35, '0')
        
        promises.push(
          fetch(`${API_BASE}/api/agents/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              handle: `concurrent-${Date.now()}-${i}`,
              name: `Concurrent ${i}`,
              wallet_address: wallet,
            }),
          })
        )
      }
      
      await Promise.all(promises)
      
      return Date.now() - start
    },
  },
]

interface BenchmarkResult {
  benchmark: Benchmark
  duration: number
  passed: boolean
  error?: string
}

async function runBenchmark(benchmark: Benchmark): Promise<BenchmarkResult> {
  try {
    const duration = await benchmark.run()
    
    // Skipped benchmarks return 0
    if (duration === 0) {
      return {
        benchmark,
        duration: 0,
        passed: true,
      }
    }
    
    const passed = duration <= benchmark.maxTime
    
    return {
      benchmark,
      duration,
      passed,
    }
  } catch (error: any) {
    return {
      benchmark,
      duration: 0,
      passed: false,
      error: error.message,
    }
  }
}

async function main() {
  console.log(chalk.blue.bold('\n⚡ WhiteClaws Performance Benchmarks\n'))
  console.log(chalk.gray(`Testing against: ${API_BASE}\n`))
  console.log(chalk.gray('━'.repeat(80)))
  
  if (!TEST_API_KEY) {
    console.log(chalk.yellow('\n⚠️  TEST_API_KEY not set - some benchmarks will be skipped\n'))
  }
  
  const results: BenchmarkResult[] = []
  
  for (const benchmark of BENCHMARKS) {
    process.stdout.write(chalk.cyan(`\n▶ ${benchmark.name}... `))
    
    const result = await runBenchmark(benchmark)
    results.push(result)
    
    if (result.duration === 0) {
      // Skipped
      continue
    }
    
    if (result.passed) {
      console.log(chalk.green(`✓ ${result.duration}ms (max: ${benchmark.maxTime}ms)`))
    } else if (result.error) {
      console.log(chalk.red(`✗ ERROR`))
      console.log(chalk.red(`  ${result.error}`))
    } else {
      console.log(chalk.red(`✗ ${result.duration}ms (max: ${benchmark.maxTime}ms)`))
    }
  }
  
  // Summary
  console.log(chalk.gray('\n' + '━'.repeat(80)))
  console.log(chalk.blue.bold('\n📊 Performance Summary\n'))
  
  const completed = results.filter(r => r.duration > 0)
  const passed = completed.filter(r => r.passed && !r.error)
  const failed = completed.filter(r => !r.passed || r.error)
  
  console.log(`Total Benchmarks: ${completed.length}`)
  console.log(chalk.green(`Passed: ${passed.length}`))
  console.log(failed.length > 0 ? chalk.red(`Failed: ${failed.length}`) : chalk.gray(`Failed: 0`))
  
  if (passed.length > 0) {
    const avgTime = Math.round(
      passed.reduce((sum, r) => sum + r.duration, 0) / passed.length
    )
    console.log(`Average Response Time: ${avgTime}ms`)
  }
  
  // Slowest endpoints
  if (passed.length > 0) {
    console.log(chalk.blue.bold('\n🐌 Slowest Endpoints:\n'))
    
    const sorted = [...passed].sort((a, b) => b.duration - a.duration)
    sorted.slice(0, 3).forEach(r => {
      const percent = Math.round((r.duration / r.benchmark.maxTime) * 100)
      console.log(`  ${r.benchmark.name}: ${r.duration}ms (${percent}% of max)`)
    })
  }
  
  // Failed benchmarks
  if (failed.length > 0) {
    console.log(chalk.red.bold('\n⚠️  Failed Benchmarks:\n'))
    failed.forEach(r => {
      console.log(chalk.red(`  • ${r.benchmark.name}`))
      if (r.error) {
        console.log(chalk.red(`    Error: ${r.error}`))
      } else {
        console.log(chalk.red(`    ${r.duration}ms (max: ${r.benchmark.maxTime}ms)`))
      }
    })
  }
  
  // Performance grade
  console.log(chalk.gray('\n' + '━'.repeat(80)))
  
  const passRate = completed.length > 0 ? (passed.length / completed.length) * 100 : 0
  
  let grade = 'F'
  let gradeColor = chalk.red
  
  if (passRate >= 95) {
    grade = 'A'
    gradeColor = chalk.green
  } else if (passRate >= 85) {
    grade = 'B'
    gradeColor = chalk.green
  } else if (passRate >= 75) {
    grade = 'C'
    gradeColor = chalk.yellow
  } else if (passRate >= 60) {
    grade = 'D'
    gradeColor = chalk.yellow
  }
  
  console.log(gradeColor.bold(`\n${grade} Grade - ${passRate.toFixed(0)}% Pass Rate\n`))
  
  if (failed.length === 0) {
    console.log(chalk.green('All benchmarks passed performance requirements!\n'))
    process.exit(0)
  } else {
    console.log(chalk.yellow('Some benchmarks need optimization before production.\n'))
    process.exit(1)
  }
}

main().catch(error => {
  console.error(chalk.red('Benchmark error:'), error)
  process.exit(1)
})
