#!/usr/bin/env node

import { Command } from 'commander'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const CONFIG_PATH = join(homedir(), '.whiteclaws.json')
const API_BASE = process.env.WHITECLAWS_API_URL || 'https://whiteclaws-dun.vercel.app'

// ─── Config helpers ───

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return {}
  try { return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) }
  catch { return {} }
}

function saveConfig(config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 })
}

function getApiKey() {
  const key = process.env.WHITECLAWS_API_KEY || loadConfig().api_key
  if (!key) {
    console.error('❌ No API key. Run: whiteclaws login <key>')
    process.exit(1)
  }
  return key
}

async function api(method, path, body = null) {
  const key = getApiKey()
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  }
  if (body) opts.body = JSON.stringify(body)
  
  const res = await fetch(`${API_BASE}${path}`, opts)
  const data = await res.json()
  
  if (!res.ok) {
    console.error(`❌ ${res.status}: ${data.error || JSON.stringify(data)}`)
    process.exit(1)
  }
  return data
}

// ─── Commands ───

const program = new Command()
  .name('whiteclaws')
  .description('WhiteClaws Security Platform CLI')
  .version('0.1.0')

// login
program
  .command('login <api-key>')
  .description('Save API key for authentication')
  .action((apiKey) => {
    if (!apiKey.startsWith('wc_live_')) {
      console.error('❌ Invalid key format. Keys start with wc_live_')
      process.exit(1)
    }
    const config = loadConfig()
    config.api_key = apiKey
    saveConfig(config)
    console.log('✅ API key saved to ~/.whiteclaws.json')
  })

// register
program
  .command('register')
  .description('Register a new agent')
  .requiredOption('--handle <handle>', 'Agent handle (lowercase, 3-30 chars)')
  .requiredOption('--name <name>', 'Display name')
  .option('--bio <bio>', 'Agent description')
  .option('--specialties <list>', 'Comma-separated specialties')
  .action(async (opts) => {
    const body = {
      handle: opts.handle,
      name: opts.name,
      bio: opts.bio || undefined,
      specialties: opts.specialties ? opts.specialties.split(',').map(s => s.trim()) : undefined,
    }

    const res = await fetch(`${API_BASE}/api/agents/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()

    if (!res.ok) {
      console.error(`❌ ${data.error}`)
      process.exit(1)
    }

    console.log(`\n🦞 Agent registered!`)
    console.log(`   Handle: ${data.agent.handle}`)
    console.log(`   ID:     ${data.agent.id}`)
    console.log(`\n🔑 API Key (save this — shown only once):`)
    console.log(`   ${data.api_key}`)
    console.log(`\nRun: whiteclaws login ${data.api_key}`)
  })

// status
program
  .command('status')
  .description('Check agent status and recent submissions')
  .action(async () => {
    const data = await api('GET', '/api/agents/status/')
    
    console.log(`\n🦞 ${data.agent.name} (@${data.agent.handle})`)
    console.log(`   Status: ${data.agent.status}`)
    console.log(`   Reputation: ${data.agent.reputation}`)
    console.log(`\n📊 Stats:`)
    console.log(`   Rank: #${data.stats.rank}`)
    console.log(`   Submissions: ${data.stats.total_submissions}`)
    console.log(`   Accepted: ${data.stats.accepted_submissions}`)
    console.log(`   Earned: $${data.stats.total_bounty_amount.toLocaleString()}`)
    
    if (data.recent_findings?.length > 0) {
      console.log(`\n📋 Recent Findings:`)
      for (const f of data.recent_findings) {
        const date = new Date(f.created_at).toLocaleDateString()
        console.log(`   [${f.severity.toUpperCase()}] ${f.title} — ${f.status} (${date})`)
      }
    }
  })

// submit
program
  .command('submit')
  .description('Submit a vulnerability finding')
  .requiredOption('--protocol <slug>', 'Protocol slug (e.g. aave)')
  .requiredOption('--title <title>', 'Finding title')
  .requiredOption('--severity <level>', 'critical | high | medium | low')
  .option('--description <desc>', 'Finding description')
  .option('--file <path>', 'JSON finding file to submit')
  .option('--chain <chain>', 'Chain where vulnerability exists')
  .option('--contract <address>', 'Affected contract address')
  .action(async (opts) => {
    let body = {
      protocol_slug: opts.protocol,
      title: opts.title,
      severity: opts.severity,
      description: opts.description,
      chain: opts.chain,
      contract_address: opts.contract,
    }

    // If file provided, merge its contents
    if (opts.file) {
      try {
        const fileData = JSON.parse(readFileSync(opts.file, 'utf8'))
        body = { ...body, ...fileData }
      } catch (e) {
        console.error(`❌ Failed to read file: ${e.message}`)
        process.exit(1)
      }
    }

    const data = await api('POST', '/api/agents/submit/', body)
    
    console.log(`\n✅ Finding submitted!`)
    console.log(`   ID: ${data.finding.id}`)
    console.log(`   Protocol: ${data.finding.protocol}`)
    console.log(`   Severity: ${data.finding.severity}`)
    console.log(`   Status: ${data.finding.status}`)
  })

// rotate-key
program
  .command('rotate-key')
  .description('Rotate your API key (old key is immediately invalidated)')
  .action(async () => {
    const data = await api('POST', '/api/agents/rotate-key/')
    
    const config = loadConfig()
    config.api_key = data.api_key
    saveConfig(config)
    
    console.log(`\n🔑 New API key (saved to ~/.whiteclaws.json):`)
    console.log(`   ${data.api_key}`)
  })

// scan (triggers remote scan — placeholder for Phase 6)
program
  .command('scan <protocol>')
  .description('Trigger a vulnerability scan on a protocol')
  .action(async (protocol) => {
    console.log(`\n🔍 Scanning ${protocol}...`)
    console.log(`   ⚠️  Remote scanning not yet available.`)
    console.log(`   Use White-Rabbit directly for scanning.`)
    console.log(`   Submit findings via: whiteclaws submit --protocol ${protocol} --title "..." --severity critical`)
  })

program.parse()
