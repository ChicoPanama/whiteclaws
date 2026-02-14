import 'server-only'

import crypto from 'crypto'
import type { NextRequest } from 'next/server'

export function getRequestIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for') || ''
  const ip = forwardedFor.split(',')[0]?.trim()
  return ip || 'unknown'
}

export function hashKey(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 32)
}

