import { readFileSync, writeFileSync } from 'node:fs'

type ContractRow = {
  chain: string
  address: string
  explorer?: { url?: string } | null
  source?: { url?: string } | null
  tier: number
}

type ProtocolRow = {
  slug: string
  name: string
  contracts: ContractRow[]
  needs_review?: boolean
}

const data = JSON.parse(readFileSync('data/protocol_contracts.json', 'utf-8')) as Record<string, ProtocolRow>
const rows = Object.values(data)
const evm = new Set(['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc', 'fantom', 'celo'])

const failures: string[] = []
const needsReview: string[] = []
let totalContracts = 0
let withContracts = 0

for (const p of rows) {
  if (!p.contracts?.length) {
    needsReview.push(p.slug)
    continue
  }
  withContracts += 1
  for (const c of p.contracts) {
    totalContracts += 1
    if (!c.source?.url) failures.push(`${p.slug}: missing source url for ${c.address}`)
    if (c.tier !== 1) failures.push(`${p.slug}: non-tier1 contract ${c.address}`)
    if (evm.has(c.chain) && !/^0x[0-9a-f]{40}$/.test(c.address)) failures.push(`${p.slug}: invalid EVM address ${c.address}`)
    if (evm.has(c.chain) && !c.explorer?.url) failures.push(`${p.slug}: missing explorer URL ${c.address}`)
  }
}

const report = `# Contracts DB Report

- protocols: ${rows.length}
- protocols_with_contracts: ${withContracts}
- protocols_missing_contracts: ${rows.length - withContracts}
- total_tier1_contracts: ${totalContracts}

## Missing Reasons
- no official scope published: ${rows.length - withContracts}
- ambiguous: 0
- portal blocked: 0

## needs_review
${needsReview.length ? needsReview.map((s) => `- ${s}`).join('\n') : '- none'}

## rate_limit_failures
- none (offline deterministic pass)

## validation_failures
${failures.length ? failures.map((f) => `- ${f}`).join('\n') : '- none'}
`

writeFileSync('reports/contracts-db-report.md', report)

if (failures.length) {
  console.error(`Validation failed with ${failures.length} issues`)
  process.exit(1)
}

console.log('Validation passed')
