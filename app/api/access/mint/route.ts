import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { address } = body

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
      return NextResponse.json({
        ok: true,
        message: 'Access already active',
        address,
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
      // Handle unique constraint (wallet already registered)
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, message: 'Access already active', address })
      }
      throw error
    }

    return NextResponse.json({
      ok: true,
      message: 'Access granted',
      userId: newUser?.id,
      address,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Access mint API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
