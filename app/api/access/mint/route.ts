import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mintSBT } from '@/lib/web3/contracts/access-sbt'
import { fireEvent } from '@/lib/points/hooks'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { address, payment_token, tx_hash } = body

    if (!address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if user already exists with this wallet
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', address)
      .single()

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
          address,
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
        address,
        has_sbt: result.ok,
        is_early: result.isEarly,
      })
    }

    // Create user record with access
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        handle: `wallet_${address.slice(2, 10).toLowerCase()}`,
        display_name: `${address.slice(0, 6)}...${address.slice(-4)}`,
        wallet_address: address,
        is_agent: false,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, message: 'Access already active', address })
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
      address,
      has_sbt: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Access mint API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
