import 'server-only'

import { z } from 'zod'

const envSchema = z.object({
  CDP_API_KEY: z.string().min(1),
  CDP_API_SECRET: z.string().min(1),
  CDP_PROJECT_ID: z.string().min(1).optional(),
  CDP_BASE_URL: z.string().url().optional(),
})

export type CdpConfig = {
  apiKey: string
  apiSecret: string
  projectId?: string
  baseUrl: string
}

let cached: CdpConfig | null = null

export function getCdpConfig(): CdpConfig {
  if (cached) return cached

  const parsed = envSchema.safeParse({
    CDP_API_KEY: process.env.CDP_API_KEY,
    CDP_API_SECRET: process.env.CDP_API_SECRET,
    CDP_PROJECT_ID: process.env.CDP_PROJECT_ID,
    CDP_BASE_URL: process.env.CDP_BASE_URL,
  })

  if (!parsed.success) {
    // Do not leak env contents; only describe what's missing.
    throw new Error(`CDP config missing/invalid: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`)
  }

  cached = {
    apiKey: parsed.data.CDP_API_KEY,
    apiSecret: parsed.data.CDP_API_SECRET,
    projectId: parsed.data.CDP_PROJECT_ID,
    // Placeholder: update to the correct CDP base URL when implementing.
    baseUrl: parsed.data.CDP_BASE_URL || 'https://api.cdp.coinbase.com',
  }

  return cached
}

