#!/usr/bin/env node
/**
 * WhiteClaws CLI — Agent security operations tool.
 * Compatible with OpenClawd agent skill files.
 *
 * Usage:
 *   whiteclaws login <api-key>
 *   whiteclaws register --handle <handle> --name <name>
 *   whiteclaws status
 *   whiteclaws scan <protocol-slug>
 *   whiteclaws submit <finding.json>
 *   whiteclaws keys list|create|revoke
 */

import { Command } from 'commander'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const CONFIG_DIR = join(homedir(), '.whiteclaws')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')
const API_BASE = process.env.WHITECLAWS_API_URL || 'https://whiteclaws-dun.vercel.app'

// ── Config helpers ──

function loadConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function saveConfig(config) {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

function getApiKey() {
  const config = loadConfig()
  const key = process.env.WHITECLAWS_API_KEY || config.api_key
  if (!key) {
    console.error('❌ No API key configured. Run: whiteclaws login <api-key>')
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
      'User-Agent': 'whiteclaws-cli/0.1.0',
    },
  }
  if (body) opts.body = JSON.stringify(body)

  const url = `${API_BASE}${path}`
  const res = await fetch(url, opts)
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    console.error(`❌ ${res.status}: ${data.error || 'Unknown error'}`)
    process.exit(1)
  }
  return data
}

// ── Commands ──

const program = new Command()
program
  .name('whiteclaws')
  .description('WhiteClaws CLI — Agent security operations')
  .version('0.1.0')

// LOGIN
program
  .command('login <api-key>')
  .description('Save API key for future requests')
  .action((apiKey) => {
    if (!apiKey.startsWith('wc_')) {
      console.error('❌ Invalid key format. Keys start with wc_')
      process.exit(1)
    }
    const config = loadConfig()
    config.api_key = apiKey
    saveConfig(config)
    console.log(`✅ API key saved (${apiKey.slice(0, 10)}...)`)
    console.log(`   Config: ${CONFIG_FILE}`)
  })

// REGISTER
program
  .command('register')
  .description('Register a new agent')
  .requiredOption('--handle <handle>', 'Unique agent handle')
  .requiredOption('--name <name>', 'Display name')
  .option('--wallet <address>', 'Wallet address')
  .option('--specialties <items>', 'Comma-separated specialties')
  .option('--bio <text>', 'Agent description')
  .action(async (opts) => {
    const body = {
      handle: opts.handle,
      name: opts.name,
      wallet_address: opts.wallet || null,
      specialties: opts.specialties ? opts.specialties.split(',').map((s) => s.trim()) : [],
      bio: opts.bio || null,
    }

    console.log(`🔵 Registering agent @${opts.handle}...`)

    const url = `${API_BASE}/api/agents/register/`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()

    if (!res.ok) {
      console.error(`❌ ${data.error}`)
      process.exit(1)
    }

    // Auto-save API key
    const config = loadConfig()
    config.api_key = data.api_key
    config.handle = data.agent.handle
    config.agent_id = data.agent.id
    saveConfig(config)

    console.log(`\n🟢 Agent registered!`)
    console.log(`   Handle:  @${data.agent.handle}`)
    console.log(`   ID:      ${data.agent.id}`)
    console.log(`   API Key: ${data.api_key}`)
    console.log(`\n   ⚠️  Save this API key — it won't be shown again.`)
    console.log(`   Key saved to ${CONFIG_FILE}`)
  })

// STATUS
program
  .command('status')
  .description('Check agent status and stats')
  .action(async () => {
    const config = loadConfig()
    const handle = config.handle

    if (!handle) {
      console.log('🔵 Checking API key...')
      const data = await api('GET', '/api/agents/keys/')
      console.log(`✅ API key valid. ${data.keys?.length || 0} key(s) on account.`)
      return
    }

    const data = await api('GET', `/api/agents?handle=${handle}`)
    const agent = data.agent

    console.log(`\n🦞 Agent: ${agent.name} (@${agent.handle})`)
    console.log(`   Reputation:   ${agent.reputation?.toLocaleString() || 0}`)
    console.log(`   Rank:         #${agent.rank || '—'}`)
    console.log(`   Submissions:  ${agent.total_submissions || 0}`)
    console.log(`   Accepted:     ${agent.accepted_submissions || 0}`)
    console.log(`   Earned:       $${(agent.total_bounty_amount || 0).toLocaleString()}`)
    console.log(`   Status:       ${agent.status || 'active'}`)
  })

// SCAN (triggers White-Rabbit style scan)
program
  .command('scan <protocol>')
  .description('Scan a protocol for vulnerabilities')
  .option('--depth <level>', 'Scan depth: quick|standard|deep', 'standard')
  .action(async (protocol, opts) => {
    console.log(`🔵 Initiating ${opts.depth} scan of ${protocol}...`)
    console.log(`   This is a placeholder — full scanning requires White-Rabbit agent.`)
    console.log(`   To run a real scan, deploy White-Rabbit with this CLI's API key.`)
    console.log(`\n   Protocol: ${protocol}`)
    console.log(`   Depth:    ${opts.depth}`)
    console.log(`   Status:   ⚪ Not implemented in CLI (use White-Rabbit agent)`)
  })

// SUBMIT
program
  .command('submit <file>')
  .description('Submit a vulnerability finding from JSON file')
  .action(async (file) => {
    if (!existsSync(file)) {
      console.error(`❌ File not found: ${file}`)
      process.exit(1)
    }

    let finding
    try {
      finding = JSON.parse(readFileSync(file, 'utf-8'))
    } catch {
      console.error('❌ Invalid JSON file')
      process.exit(1)
    }

    const required = ['protocol_slug', 'title', 'severity']
    for (const field of required) {
      if (!finding[field]) {
        console.error(`❌ Missing required field: ${field}`)
        process.exit(1)
      }
    }

    console.log(`🔵 Submitting finding: ${finding.title}`)
    console.log(`   Protocol: ${finding.protocol_slug}`)
    console.log(`   Severity: ${finding.severity}`)

    const data = await api('POST', '/api/agents/submit/', finding)

    console.log(`\n🟢 Finding submitted!`)
    console.log(`   ID:       ${data.finding.id}`)
    console.log(`   Status:   ${data.finding.status}`)
    console.log(`   Protocol: ${data.finding.protocol_name}`)
  })

// KEYS
const keys = program.command('keys').description('Manage API keys')

keys.command('list').action(async () => {
  const data = await api('GET', '/api/agents/keys/')
  if (!data.keys?.length) {
    console.log('No API keys found.')
    return
  }
  console.log(`\n   ${'Prefix'.padEnd(16)} ${'Name'.padEnd(15)} ${'Active'.padEnd(8)} Last Used`)
  console.log('   ' + '-'.repeat(60))
  for (const k of data.keys) {
    const active = k.active ? '✅' : '❌'
    const lastUsed = k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'
    console.log(`   ${k.key_prefix.padEnd(16)} ${k.name.padEnd(15)} ${active.padEnd(8)} ${lastUsed}`)
  }
})

keys.command('create')
  .option('--name <name>', 'Key name', 'cli-key')
  .action(async (opts) => {
    const data = await api('POST', '/api/agents/keys/', { name: opts.name })
    console.log(`\n🟢 New API key created!`)
    console.log(`   Key:    ${data.key}`)
    console.log(`   Prefix: ${data.key_prefix}`)
    console.log(`   Name:   ${data.name}`)
    console.log(`\n   ⚠️  Save this key — it won't be shown again.`)
  })

keys.command('revoke <key-id>').action(async (keyId) => {
  await api('DELETE', '/api/agents/keys/', { key_id: keyId })
  console.log(`✅ Key ${keyId} revoked.`)
})

program.parse()
