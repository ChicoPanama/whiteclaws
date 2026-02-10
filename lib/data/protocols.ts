import fs from 'fs'
import path from 'path'

export interface ProtocolJSON {
  slug: string
  name: string
  description?: string
  category: string
  chains: string[]
  logo_url?: string | null
  branding?: {
    primary: string
    accent: string
    text_on_primary: string
  }
  bounty: {
    max: number
    min: number
    kyc_required?: boolean
    payout_token?: string
  }
  severity_payouts?: Record<string, { min: number; max: number; description: string }>
  contracts?: Array<{ address: string; network: string; name: string; type: string }>
  scope?: {
    in_scope: string[]
    out_of_scope: string[]
    functions_critical?: string[]
    functions_high?: string[]
  }
  source?: string
  updated_at?: string
}

function getProtocolsDir(): string {
  return path.join(process.cwd(), 'public', 'protocols')
}

export function getProtocolsFromJSON(): ProtocolJSON[] {
  const indexPath = path.join(getProtocolsDir(), '_index.json')
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  const slugs: string[] = index.protocols.map((p: { slug: string }) => p.slug)

  return slugs
    .map((slug) => {
      try {
        const filePath = path.join(getProtocolsDir(), `${slug}.json`)
        return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ProtocolJSON
      } catch {
        return null
      }
    })
    .filter((p): p is ProtocolJSON => p !== null)
    .sort((a, b) => (b.bounty?.max ?? 0) - (a.bounty?.max ?? 0))
}

export function getProtocolBySlug(slug: string): ProtocolJSON | null {
  try {
    const safe = slug.replace(/[^a-z0-9-]/g, '')
    const filePath = path.join(getProtocolsDir(), `${safe}.json`)
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ProtocolJSON
  } catch {
    return null
  }
}
