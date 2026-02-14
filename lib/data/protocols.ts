import fs from 'fs'
import path from 'path'
import { type Disclosure, withProtocolDisclosure } from '@/lib/protocolContacts'

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
  severity_payouts?: Record<string, {
    min: number
    max: number
    description: string
    reward_calc?: string
  }>

  // Program metadata
  live_since?: string
  last_updated?: string
  poc_required?: boolean
  primacy_of_impact?: boolean
  arbitration_enabled?: boolean
  triaged?: boolean
  payout_tokens?: string[]
  program_rules?: string[]

  // Submission standards
  submission_requirements?: {
    report_format?: string[]
    severity_criteria?: Record<string, string>
  }
  eligibility?: string[]
  program_tags?: string[]

  // External links
  external_url?: string
  website_url?: string
  github_url?: string
  docs_url?: string
  audits_url?: string

  contracts?: Array<{ address: string; network: string; name: string; type: string }>
  scope?: {
    in_scope: string[]
    out_of_scope: string[]
    functions_critical?: string[]
    functions_high?: string[]
  }
  source?: string
  updated_at?: string
  disclosure?: Disclosure | null
  verified?: boolean
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
        const protocol = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ProtocolJSON
        return withProtocolDisclosure(protocol)
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
    const protocol = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ProtocolJSON
    return withProtocolDisclosure(protocol)
  } catch {
    return null
  }
}
