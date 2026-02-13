import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'
import { mintSBT, type PaymentToken } from '@/lib/web3/contracts/access-sbt'
import { fireEvent } from '@/lib/points/hooks'

export const dynamic = 'force-dynamic'

/**
 * POST /api/sbt/mint
 * Mint an Access SBT. Records in Supabase immediately.
 * When contract is deployed, also verifies onchain tx.
 *
 * Body: { wallet_address, payment_token?: "USDC"|"ETH"|"WC", tx_hash? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { wallet_address, payment_token, tx_hash } = body

    if (!wallet_address || typeof wallet_address !== 'string') {
      return NextResponse.json({ error: 'wallet_address is required' }, { status: 400 })
    }

    // Normalize address
    const address = wallet_address.toLowerCase()
    const paymentType: PaymentToken = ['USDC', 'ETH', 'WC'].includes(payment_token)
      ? payment_token
      : 'USDC'

    const supabase = createClient()

    // Find or create user for this wallet
    let userId: string

    const { data: existing } = await (supabase
      .from('users')
      .select('id')
      .eq('wallet_address', address)
      .returns<Row<'users'>[]>().maybeSingle())

    if (existing) {
      userId = existing.id
    } else {
      // Create user record
      const { data: newUser, error: createErr } = await (supabase
        .from('users')
        .insert({
          handle: `wallet_${address.slice(2, 10)}`,
          display_name: `${address.slice(0, 6)}...${address.slice(-4)}`,
          wallet_address: address,
          is_agent: false,
          status: 'active',
        })
        .select('id')
        .single())

      if (createErr) {
        if (createErr.code === '23505') {
          // Race condition — wallet just registered, try again
          const { data: retry } = await (supabase
            .from('users')
            .select('id')
            .eq('wallet_address', address)
            .returns<Row<'users'>[]>().single())
          userId = retry?.id ?? ''
        } else {
          throw createErr
        }
      } else {
        userId = newUser.id
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })
    }

    // Mint SBT
    const result = await mintSBT(userId, address, paymentType, tx_hash)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    // Fire points events (non-blocking)
    fireEvent(userId, 'sbt_minted', { payment_token: paymentType, tx_hash })
    if (result.isEarly) {
      fireEvent(userId, 'sbt_minted_early', { payment_token: paymentType })
    }

    return NextResponse.json({
      ok: true,
      sbt: {
        wallet_address: address,
        minted_at: new Date().toISOString(),
        is_early: result.isEarly,
        token_id: result.tokenId || null,
        payment_token: paymentType,
      },
      message: result.isEarly
        ? 'Access SBT minted! You are an early supporter — this will be recognized.'
        : 'Access SBT minted! You can now earn points.',
    }, { status: 201 })
  } catch (error) {
    console.error('SBT mint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
