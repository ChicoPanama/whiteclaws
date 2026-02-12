import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

type ProtocolFile = {
  slug?: string
  name?: string
  chains?: string[]
  url?: string
  source?: string
  program_rules?: string[]
  submission_requirements?: string[]
  eligibility?: string[]
}

const PROTOCOLS_DIR = 'public/protocols'
const OUT_FILE = 'data/whiteclaws_protocol_index.json'

const URL_REGEX = /https?:\/\/[^\s)\]"']+/gi

function extractUrls(value: unknown): string[] {
  if (typeof value === 'string') return value.match(URL_REGEX) ?? []
  if (Array.isArray(value)) return value.flatMap(extractUrls)
  if (value && typeof value === 'object') return Object.values(value).flatMap(extractUrls)
  return []
}

const files = readdirSync(PROTOCOLS_DIR)
  .filter((f) => f.endsWith('.json') && f !== '_index.json')
  .sort((a, b) => a.localeCompare(b))

const protocols = files.map((file) => {
  const fullPath = join(PROTOCOLS_DIR, file)
  const json = JSON.parse(readFileSync(fullPath, 'utf-8')) as ProtocolFile
  const slug = json.slug ?? file.replace(/\.json$/, '')

  const discoveredUrls = Array.from(new Set([
    ...extractUrls(json.url),
    ...extractUrls(json.source),
    ...extractUrls(json.program_rules),
    ...extractUrls(json.submission_requirements),
    ...extractUrls(json.eligibility),
  ])).sort()

  return {
    slug,
    name: json.name ?? slug,
    chains: Array.isArray(json.chains) ? json.chains : [],
    filepath: fullPath,
    links: {
      website: typeof json.url === 'string' ? json.url : null,
      discovered: discoveredUrls,
    },
  }
})

writeFileSync(
  OUT_FILE,
  `${JSON.stringify({ count: protocols.length, protocols }, null, 2)}\n`,
)

console.log(`Wrote ${OUT_FILE} (${protocols.length} protocols)`)
