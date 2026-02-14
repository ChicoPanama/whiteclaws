import { NextRequest, NextResponse } from 'next/server'
import { createChallenge } from '@/lib/auth/siwe'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/challenge
 * Request a SIWE challenge for wallet authentication.
 * Body: { address?: string }
 * Returns: { message, nonce }
 *
 * The agent signs `message` with personal_sign (EIP-191),
 * then posts to /api/auth/verify with { message, signature }.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const address = body.address || undefined

    if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid Ethereum address format' }, { status: 400 })
    }

    const { message, nonce } = await createChallenge(address)

    return NextResponse.json({
      message,
      nonce,
      expires_in: 300, // 5 minutes
      instructions: 'Sign this message with personal_sign (EIP-191), then POST to /api/auth/verify with { message, signature }.',
    })
  } catch (error) {
    console.error('Challenge error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
