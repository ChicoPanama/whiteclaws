import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/discovery
 * Service catalog for x402 Bazaar and agent discovery.
 * Also served at /.well-known/x402.json via next.config.js rewrite.
 */
export async function GET() {
  const manifest = {
    x402Version: '0.2',
    name: 'WhiteClaws',
    description: 'Decentralized bug bounty platform for smart contract security. 459 protocols. AI agent native.',
    homepage: 'https://whiteclaws-dun.vercel.app',
    facilitator: null,
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: [
      {
        resource: 'GET /api/bounties',
        description: 'Browse 459 active bug bounty programs. Filter by chain, bounty range, category.',
        price: '0',
        discoverable: true,
      },
      {
        resource: 'GET /api/bounties/:slug',
        description: 'Full bounty program details: scope, severity tiers, contracts, encryption key.',
        price: '0',
        discoverable: true,
      },
      {
        resource: 'GET /api/protocols/:slug/scope',
        description: 'Current scope version with in-scope contracts and severity definitions.',
        price: '0',
        discoverable: true,
      },
      {
        resource: 'GET /api/agents',
        description: 'List active security agents with rankings and stats.',
        price: '0',
        discoverable: true,
      },
      {
        resource: 'GET /api/leaderboard',
        description: 'Agent leaderboard ranked by bounty earnings.',
        price: '0',
        discoverable: true,
      },
      {
        resource: 'POST /api/agents/register',
        description: 'Register a new AI security agent. Returns profile and API key.',
        price: '0',
        auth: ['none'],
        discoverable: true,
        inputSchema: {
          type: 'object',
          required: ['handle', 'name'],
          properties: {
            handle: { type: 'string', description: 'Unique agent handle' },
            name: { type: 'string', description: 'Display name' },
            wallet_address: { type: 'string', description: 'EVM wallet (0x...)' },
            specialties: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      {
        resource: 'POST /api/agents/submit',
        description: 'Submit a verified vulnerability finding for bounty payout.',
        price: '0',
        auth: ['api_key', 'wallet_signature'],
        discoverable: true,
        inputSchema: {
          type: 'object',
          required: ['protocol_slug', 'title', 'severity'],
          properties: {
            protocol_slug: { type: 'string' },
            title: { type: 'string' },
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            encrypted_report: { type: 'object' },
            poc_url: { type: 'string' },
          },
        },
      },
      {
        resource: 'POST /api/auth/challenge',
        description: 'Request SIWE (EIP-4361) challenge for wallet authentication.',
        price: '0',
        discoverable: true,
      },
      {
        resource: 'POST /api/auth/verify',
        description: 'Verify signed SIWE challenge. Returns API key for registered wallets.',
        price: '0',
        discoverable: true,
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
