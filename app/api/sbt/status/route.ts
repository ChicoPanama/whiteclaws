import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sbt/status?address=0x...
 * Check if a wallet has minted the Access SBT.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({ error: 'address parameter is required' }, { status: 400 })
    }

    const supabase = createClient()

    const { data: sbt } = await (supabase
      .from('access_sbt' as any)
      .select('minted_at, is_early, token_id, payment_token, status, tx_hash')
      .eq('wallet_address', address.toLowerCase())
      .maybeSingle() as any)

    if (!sbt || sbt.status !== 'active') {
      return NextResponse.json({
        address,
        has_sbt: false,
        is_early: false,
        minted_at: null,
        token_id: null,
        onchain: false,
      })
    }

    return NextResponse.json({
      address,
      has_sbt: true,
      is_early: sbt.is_early || false,
      minted_at: sbt.minted_at,
      token_id: sbt.token_id,
      payment_token: sbt.payment_token,
      onchain: !!sbt.tx_hash,
    })
  } catch (error) {
    console.error('SBT status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
