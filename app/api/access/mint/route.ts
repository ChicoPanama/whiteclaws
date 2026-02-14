import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { mintSBT } from '@/lib/web3/contracts/access-sbt'
import { fireEvent } from '@/lib/points/hooks'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const mintRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  payment_token: z.enum(['USDC', 'ETH', 'WC']).optional(),
  tx_hash: z.string().min(1).optional(),
})

type RateEntry = { windowStartMs: number; count: number }
const rateLimitState = new Map<string, RateEntry>()

function rateLimitOrNull(req: NextRequest, limit: number, windowMs: number): NextResponse | null {
  const forwardedFor = req.headers.get('x-forwarded-for') || ''
  const ip = forwardedFor.split(',')[0]?.trim() || 'unknown'
  const key = `access_mint:${ip}`

  const now = Date.now()
  const entry = rateLimitState.get(key)
  if (!entry || now - entry.windowStartMs >= windowMs) {
    rateLimitState.set(key, { windowStartMs: now, count: 1 })
    return null
  }

  entry.count += 1
  if (entry.count > limit) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  return null
}

async function requireAuthenticatedSession(): Promise<
  { ok: true; userId: string } | { ok: false; res: NextResponse }
> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.user?.id) {
    return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { ok: true, userId: data.session.user.id }
}

function requireAdminKey(req: NextRequest): { ok: true } | { ok: false; res: NextResponse } {
  const adminKey = process.env.ADMIN_API_KEY
  const authHeader = req.headers.get('authorization')
  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { ok: true }
}

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimitOrNull(req, 10, 60_000)
    if (rl) return rl

    const session = await requireAuthenticatedSession()
    if (!session.ok) return session.res

    // Safest until onchain/token/AA enforcement exists: admin-only mint/grant.
    const admin = requireAdminKey(req)
    if (!admin.ok) return admin.res

    const body = await req.json().catch(() => ({}))
    const parsed = mintRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { address, payment_token, tx_hash } = parsed.data
    const normalizedAddress = address.toLowerCase()

    const supabase = createAdminClient()

    // Check if user already exists with this wallet
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', normalizedAddress)
      .maybeSingle()

    if (existing) {
      // Check if SBT already exists
      const { data: sbt } = await (supabase)
        .from('access_sbt')
        .select('id, is_early')
        .eq('user_id', existing.id)
        .maybeSingle()

      if (sbt) {
        return NextResponse.json({
          ok: true,
          message: 'Access already active',
          address: normalizedAddress,
          has_sbt: true,
        })
      }

      // User exists but no SBT — mint one
      const result = await mintSBT(existing.id, address, payment_token || 'USDC', tx_hash)
      if (result.ok) {
        fireEvent(existing.id, 'sbt_minted', { payment_token: payment_token || 'USDC' })
        if (result.isEarly) fireEvent(existing.id, 'sbt_minted_early', {})
      }

      return NextResponse.json({
        ok: true,
        message: result.ok ? 'Access SBT minted' : 'Access granted (SBT pending)',
        address: normalizedAddress,
        has_sbt: result.ok,
        is_early: result.isEarly,
      })
    }

    // Create user record with access
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        handle: `wallet_${normalizedAddress.slice(2, 10)}`,
        display_name: `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`,
        wallet_address: normalizedAddress,
        is_agent: false,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, message: 'Access already active', address: normalizedAddress })
      }
      throw error
    }

    // Mint SBT for new user
    if (newUser) {
      const result = await mintSBT(newUser.id, address, payment_token || 'USDC', tx_hash)
      if (result.ok) {
        fireEvent(newUser.id, 'sbt_minted', { payment_token: payment_token || 'USDC' })
        if (result.isEarly) fireEvent(newUser.id, 'sbt_minted_early', {})
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Access granted',
      userId: newUser?.id,
      address: normalizedAddress,
      has_sbt: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Access mint API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
