import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

type InputContract = {
  address?: string
  network?: string
  name?: string
  type?: string
}

type Protocol = {
  slug: string
  name?: string
  chains?: string[]
  contracts?: InputContract[]
  scope?: Record<string, unknown>
  url?: string
  program_rules?: string[]
  submission_requirements?: string[]
  eligibility?: string[]
}

const PROTOCOL_DIR = 'public/protocols'
const OUT_JSON = 'data/protocol_contracts.json'
const OUT_CSV = 'data/protocol_contracts.csv'
const OUT_SOURCES = 'data/protocol_contracts_sources.json'
const TODAY = new Date().toISOString().slice(0, 10)
const URL_REGEX = /https?:\/\/[^\s)\]"']+/gi

const CHAIN_EXPLORER: Record<string, { name: string; base: string }> = {
  ethereum: { name: 'etherscan', base: 'https://etherscan.io/address/' },
  base: { name: 'basescan', base: 'https://basescan.org/address/' },
  arbitrum: { name: 'arbiscan', base: 'https://arbiscan.io/address/' },
  optimism: { name: 'opscan', base: 'https://optimistic.etherscan.io/address/' },
  polygon: { name: 'polygonscan', base: 'https://polygonscan.com/address/' },
  avalanche: { name: 'snowtrace', base: 'https://snowtrace.io/address/' },
  bsc: { name: 'bscscan', base: 'https://bscscan.com/address/' },
  fantom: { name: 'ftmscan', base: 'https://ftmscan.com/address/' },
  celo: { name: 'celoscan', base: 'https://celoscan.io/address/' },
}

const EVM_CHAINS = new Set(Object.keys(CHAIN_EXPLORER))

function extractUrls(value: unknown): string[] {
  if (typeof value === 'string') return value.match(URL_REGEX) ?? []
  if (Array.isArray(value)) return value.flatMap(extractUrls)
  if (value && typeof value === 'object') return Object.values(value).flatMap(extractUrls)
  return []
}

function normalizeChain(chain: string | undefined): string {
  const c = (chain || 'unknown').toLowerCase().trim()
  const aliases: Record<string, string> = {
    mainnet: 'ethereum',
    eth: 'ethereum',
    arb: 'arbitrum',
    op: 'optimism',
    matic: 'polygon',
    avax: 'avalanche',
    binance: 'bsc',
  }
  return aliases[c] ?? c
}

function checksumless(address: string): string {
  return /^0x[0-9a-fA-F]{40}$/.test(address) ? `0x${address.slice(2).toLowerCase()}` : address
}

const files = readdirSync(PROTOCOL_DIR).filter((f) => f.endsWith('.json') && f !== '_index.json').sort()

const merged: Record<string, unknown> = {}
const sources: Record<string, unknown> = {}
const csvRows: string[] = ['slug,name,chain,address,label,type,is_verified,explorer_url,source_url,tier,last_verified,needs_review']

for (const file of files) {
  const protocol = JSON.parse(readFileSync(`${PROTOCOL_DIR}/${file}`, 'utf-8')) as Protocol
  const slug = protocol.slug || file.replace(/\.json$/, '')
  const name = protocol.name || slug
  const urls = Array.from(new Set([
    ...extractUrls(protocol.url),
    ...extractUrls(protocol.program_rules),
    ...extractUrls(protocol.submission_requirements),
    ...extractUrls(protocol.eligibility),
  ]))
  const authoritativeUrl = urls[0] || null

  const contractMap = new Map<string, any>()
  for (const c of protocol.contracts ?? []) {
    if (!c?.address) continue
    const chain = normalizeChain(c.network)
    const rawAddress = String(c.address).trim()
    if (rawAddress.toLowerCase() === 'tbd') continue
    if (EVM_CHAINS.has(chain) && !/^0x[0-9a-fA-F]{40}$/.test(rawAddress)) continue
    const address = checksumless(rawAddress)
    const key = `${chain}:${address}`
    const explorerCfg = CHAIN_EXPLORER[chain]
    const explorer = explorerCfg ? { name: explorerCfg.name, url: `${explorerCfg.base}${address}` } : null

    contractMap.set(key, {
      chain,
      address,
      label: c.name || 'Unlabeled Contract',
      type: c.type ? String(c.type).toLowerCase() : 'unknown',
      is_verified: null,
      explorer,
      source: authoritativeUrl
        ? { kind: 'bounty_scope', url: authoritativeUrl }
        : { kind: 'github', url: `https://github.com/whiteclaws` },
      abi_source: {
        kind: explorer ? 'none' : 'none',
        url: explorer?.url ?? '',
        status: explorer ? 'not_supported' : 'not_supported',
      },
      notes: authoritativeUrl ? '' : 'Needs protocol-published official scope URL confirmation.',
      tier: 1,
      last_verified: TODAY,
    })
  }

  const contracts = [...contractMap.values()].sort((a, b) => `${a.chain}:${a.address}`.localeCompare(`${b.chain}:${b.address}`))
  const needsReview = !authoritativeUrl

  merged[slug] = {
    slug,
    name,
    chains: protocol.chains ?? [],
    needs_review: needsReview,
    scope: {
      mode: 'tier1_official',
      tier2_surface_expansion: {
        status: 'coming_soon',
        opt_in_required: true,
        premium: true,
        features: {
          factory_expansion: true,
          proxy_tracking: true,
          upgrade_history: true,
          deployer_graph: true,
          dependency_mapping: true,
        },
      },
    },
    contracts,
  }

  sources[slug] = {
    source_candidates: urls,
    selected_source: authoritativeUrl,
    derivation: 'Tier 1 uses protocol-declared contracts from WhiteClaws dataset and requires an authoritative URL per protocol for confidence.',
  }

  if (contracts.length === 0) {
    csvRows.push(`${slug},"${name}",,,,,,,,1,,${needsReview}`)
  } else {
    for (const c of contracts) {
      csvRows.push([
        slug,
        `"${name.replaceAll('"', '""')}"`,
        c.chain,
        c.address,
        `"${String(c.label).replaceAll('"', '""')}"`,
        c.type,
        c.is_verified === null ? '' : String(c.is_verified),
        c.explorer?.url ?? '',
        c.source.url,
        c.tier,
        c.last_verified,
        needsReview,
      ].join(','))
    }
  }
}

writeFileSync(OUT_JSON, `${JSON.stringify(merged, null, 2)}\n`)
writeFileSync(OUT_SOURCES, `${JSON.stringify(sources, null, 2)}\n`)
writeFileSync(OUT_CSV, `${csvRows.join('\n')}\n`)

console.log(`Wrote ${OUT_JSON}, ${OUT_SOURCES}, ${OUT_CSV}`)
