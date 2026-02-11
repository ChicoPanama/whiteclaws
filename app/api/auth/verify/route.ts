import { NextRequest, NextResponse } from 'next/server'
import { verifyChallenge, resolveWalletUser } from '@/lib/auth/siwe'
import { generateApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/verify
 * Verify a signed SIWE challenge.
 * Body: { message, signature }
 * Returns: { address, user?, api_key? }
 *
 * If the wallet is already registered, returns user info + new API key.
 * If unregistered, returns just the verified address — agent must register first.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, signature } = body

    if (!message || !signature) {
      return NextResponse.json({ error: 'message and signature are required' }, { status: 400 })
    }

    const result = await verifyChallenge(message, signature)
    if (!result) {
      return NextResponse.json({
        error: 'Invalid or expired signature. Request a new challenge from /api/auth/challenge.',
      }, { status: 401 })
    }

    // Try to resolve wallet to existing user
    const userInfo = await resolveWalletUser(result.address)

    if (userInfo) {
      // Known wallet — issue a fresh API key
      const { key, keyPrefix } = await generateApiKey(
        userInfo.userId,
        'siwe-session',
        ['agent:read', 'agent:submit']
      )

      return NextResponse.json({
        verified: true,
        address: result.address,
        user: {
          id: userInfo.userId,
          handle: userInfo.handle,
        },
        api_key: key,
        api_key_prefix: keyPrefix,
        message: 'Wallet verified. API key issued. Save it — it will not be shown again.',
      })
    }

    // Unknown wallet — verified but not registered
    return NextResponse.json({
      verified: true,
      address: result.address,
      user: null,
      message: 'Wallet verified but not registered. POST to /api/agents/register with this address to create your agent.',
    })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
