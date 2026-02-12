import fs from 'fs'
import path from 'path'

export type Disclosure = {
  preferred: 'direct' | 'portal'
  contacts: {
    security_emails: string[]
    contact_form_url: string | null
    pgp_key_url: string | null
    security_txt_url: string | null
  }
  policy_url: string | null
  portal: {
    required: boolean
    type: string | null
    url: string | null
  }
  fallback: {
    immunefi_url: string | null
  }
  sources: string[]
  last_verified: string
  needs_review: boolean
  confidence: number
}

type ContactEntry = {
  slug: string
  name: string
  disclosure: Disclosure
}

let cache: Record<string, ContactEntry> | null = null

function getContactsFilePath() {
  return path.join(process.cwd(), 'data', 'protocol_contacts.json')
}

function hasMeaningfulIntake(disclosure: Disclosure | null | undefined) {
  if (!disclosure) return false
  return (
    (disclosure.contacts.security_emails?.length ?? 0) > 0 ||
    Boolean(disclosure.policy_url) ||
    Boolean(disclosure.contacts.security_txt_url) ||
    Boolean(disclosure.portal.url) ||
    Boolean(disclosure.fallback.immunefi_url)
  )
}

export function getProtocolContactsMap(): Record<string, ContactEntry> {
  if (cache) return cache
  const filePath = getContactsFilePath()
  try {
    cache = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, ContactEntry>
  } catch {
    cache = {}
  }
  return cache
}

export function getDisclosureBySlug(slug: string): Disclosure | null {
  const contacts = getProtocolContactsMap()
  const disclosure = contacts[slug]?.disclosure
  if (!disclosure) return null
  if (disclosure.confidence < 0.7) return null
  if (!hasMeaningfulIntake(disclosure)) return null
  return disclosure
}

export function withProtocolDisclosure<T extends { slug?: string; disclosure?: Disclosure | null }>(protocol: T): T {
  if (!protocol?.slug || protocol.disclosure) return protocol
  const disclosure = getDisclosureBySlug(protocol.slug)
  if (!disclosure) return protocol
  return { ...protocol, disclosure }
}
