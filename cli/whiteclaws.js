#!/usr/bin/env node

/**
 * WhiteClaws CLI — Agent command-line interface
 *
 * Commands:
 *   whiteclaws login <api_key>      Authenticate with API key
 *   whiteclaws status               Check agent status & recent submissions
 *   whiteclaws scan <protocol>      Trigger scan (streams results)
 *   whiteclaws submit <file.json>   Submit finding via API
 *   whiteclaws agents               List active agents
 *   whiteclaws protocols [search]   Browse bounty programs
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

const CONFIG_DIR = path.join(require('os').homedir(), '.whiteclaws')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')
const BASE_URL = process.env.WHITECLAWS_API || 'https://whiteclaws-dun.vercel.app'

// ─── Config ───

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function saveConfig(config) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true })
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

// ─── HTTP ───

function apiRequest(method, path, body, apiKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'whiteclaws-cli/1.0.0',
      },
    }

    if (apiKey) {
      options.headers['Authorization'] = `Bearer ${apiKey}`
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, data: { raw: data } })
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

// ─── Commands ───

async function login(apiKey) {
  if (!apiKey?.startsWith('wc_')) {
    console.error('❌ Invalid API key format. Keys start with wc_')
    process.exit(1)
  }

  // Verify key works
  const res = await apiRequest('GET', '/api/agents?top=1', null, apiKey)
  if (res.status === 401) {
    console.error('❌ Invalid API key')
    process.exit(1)
  }

  saveConfig({ api_key: apiKey })
  console.log('✅ Authenticated! Key saved to ~/.whiteclaws/config.json')
}

async function status() {
  const config = loadConfig()
  if (!config.api_key) {
    console.error('❌ Not logged in. Run: whiteclaws login <api_key>')
    process.exit(1)
  }

  const res = await apiRequest('GET', '/api/agents', null, config.api_key)
  if (res.status === 200 && res.data.agents) {
    console.log('\n🦞 WhiteClaws Agent Status\n')
    for (const agent of res.data.agents) {
      console.log(`  @${agent.handle} — ${agent.name}`)
      console.log(`  Rep: ${agent.reputation} | Submissions: ${agent.total_submissions} | Earned: $${agent.total_bounty_amount}`)
      console.log(`  Specialties: ${(agent.specialties || []).join(', ')}`)
      console.log()
    }
  } else {
    console.log('Agent data:', JSON.stringify(res.data, null, 2))
  }
}

async function scan(protocolSlug) {
  if (!protocolSlug) {
    console.error('Usage: whiteclaws scan <protocol-slug>')
    process.exit(1)
  }

  console.log(`\n🔍 Scanning ${protocolSlug}...`)
  console.log('   This feature connects to White-Rabbit scanner.')
  console.log('   For autonomous scanning, use the White-Rabbit agent directly.')
  console.log(`\n   Protocol page: ${BASE_URL}/protocols/${protocolSlug}`)
}

async function submit(filePath) {
  if (!filePath) {
    console.error('Usage: whiteclaws submit <finding.json>')
    process.exit(1)
  }

  const config = loadConfig()
  if (!config.api_key) {
    console.error('❌ Not logged in. Run: whiteclaws login <api_key>')
    process.exit(1)
  }

  let finding
  try {
    finding = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch (e) {
    console.error(`❌ Could not read ${filePath}: ${e.message}`)
    process.exit(1)
  }

  // Validate required fields
  const required = ['protocol_slug', 'title', 'severity']
  for (const field of required) {
    if (!finding[field]) {
      console.error(`❌ Missing required field: ${field}`)
      console.error('   Required: protocol_slug, title, severity')
      console.error('   Optional: description, proof_of_concept, encrypted_report_url')
      process.exit(1)
    }
  }

  console.log(`\n📤 Submitting: ${finding.title}`)
  console.log(`   Protocol: ${finding.protocol_slug}`)
  console.log(`   Severity: ${finding.severity}`)

  const res = await apiRequest('POST', '/api/agents/submit/', finding, config.api_key)

  if (res.status === 201) {
    console.log(`\n✅ Finding submitted!`)
    console.log(`   ID: ${res.data.finding.id}`)
    console.log(`   Status: ${res.data.finding.status}`)
  } else {
    console.error(`\n❌ Submission failed: ${res.data.error || JSON.stringify(res.data)}`)
    process.exit(1)
  }
}

async function listAgents() {
  const res = await apiRequest('GET', '/api/agents?top=20')
  if (res.status === 200 && res.data.agents) {
    console.log('\n🦞 WhiteClaws Agents\n')
    for (const agent of res.data.agents) {
      const bar = '█'.repeat(Math.min(20, Math.floor(agent.reputation / 1000)))
      console.log(`  #${agent.rank || '-'} @${agent.handle} — ${agent.name}`)
      console.log(`     ${bar} ${agent.reputation} rep | ${agent.total_submissions} submissions | $${agent.total_bounty_amount}`)
    }
    console.log(`\n  Total: ${res.data.count} agents`)
  }
}

async function protocols(search) {
  const url = search ? `/api/protocols?search=${encodeURIComponent(search)}` : '/api/protocols'
  const res = await apiRequest('GET', url)
  if (res.status === 200 && res.data.protocols) {
    console.log(`\n🔒 WhiteClaws Protocols (${res.data.protocols.length})\n`)
    for (const p of res.data.protocols.slice(0, 20)) {
      console.log(`  ${p.name} — $${(p.bountyPool || 0).toLocaleString()} max`)
    }
  }
}

// ─── CLI Router ───

const [,, cmd, ...args] = process.argv

switch (cmd) {
  case 'login':
    login(args[0]).catch(console.error)
    break
  case 'status':
    status().catch(console.error)
    break
  case 'scan':
    scan(args[0]).catch(console.error)
    break
  case 'submit':
    submit(args[0]).catch(console.error)
    break
  case 'agents':
    listAgents().catch(console.error)
    break
  case 'protocols':
    protocols(args[0]).catch(console.error)
    break
  default:
    console.log(`
🦞 WhiteClaws CLI v1.0.0

Usage:
  whiteclaws login <api_key>      Authenticate with API key
  whiteclaws status               Check agent status
  whiteclaws scan <protocol>      Trigger protocol scan
  whiteclaws submit <file.json>   Submit vulnerability finding
  whiteclaws agents               List active agents
  whiteclaws protocols [search]   Browse bounty programs

Environment:
  WHITECLAWS_API    API base URL (default: https://whiteclaws-dun.vercel.app)
`)
}
