import 'server-only'

import { getCdpConfig } from '@/lib/cdp/config'

function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase().includes('authorization') || k.toLowerCase().includes('secret') || k.toLowerCase().includes('key')) {
      out[k] = 'REDACTED'
    } else {
      out[k] = v
    }
  }
  return out
}

/**
 * Server-only fetch wrapper for CDP.
 * NOTE: This is scaffolding only; actual endpoints/headers may differ based on the CDP product used.
 */
export async function cdpFetch(path: string, init: RequestInit & { timeoutMs?: number } = {}) {
  const cfg = getCdpConfig()
  const url = new URL(path.replace(/^\//, ''), cfg.baseUrl.replace(/\/+$/, '') + '/')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {}),
  }

  // Placeholder auth. Replace with the correct CDP auth mechanism when implementing.
  headers['X-CDP-API-KEY'] = cfg.apiKey
  headers['X-CDP-API-SECRET'] = cfg.apiSecret
  if (cfg.projectId) headers['X-CDP-PROJECT-ID'] = cfg.projectId

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? 15_000)

  try {
    const res = await fetch(url.toString(), {
      ...init,
      headers,
      signal: controller.signal,
    })

    const text = await res.text()
    let json: any = null
    try { json = text ? JSON.parse(text) : null } catch { json = null }

    if (!res.ok) {
      const err = new Error(`CDP request failed (${res.status})`)
      ;(err as any).cdp = {
        status: res.status,
        url: url.toString(),
        headers: redactHeaders(headers),
        body: json ?? text,
      }
      throw err
    }

    return { ok: true as const, status: res.status, data: json ?? text }
  } finally {
    clearTimeout(timeout)
  }
}

