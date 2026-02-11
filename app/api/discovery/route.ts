import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

/**
 * GET /api/discovery
 * Service catalog for x402 Bazaar and agent discovery.
 * Serves the .well-known/x402.json manifest with live stats.
 */
export async function GET() {
  try {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), 'public', '.well-known', 'x402.json'), 'utf-8')
    )

    // Add live metadata
    manifest.timestamp = new Date().toISOString()
    manifest.status = 'operational'

    return NextResponse.json(manifest, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 min cache
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Discovery error:', error)
    return NextResponse.json({ error: 'Service catalog unavailable' }, { status: 500 })
  }
}
