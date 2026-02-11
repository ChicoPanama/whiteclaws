import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  const content = readFileSync(join(process.cwd(), 'public', '.well-known', 'x402.json'), 'utf-8')
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
