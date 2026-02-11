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

    // Check if user already has access
    const { data: existing } = await supabase
      .from('users')
      .select('id, wallet_address')
      .eq('wallet_address', address)
      .single()

    if (existing) {
      return NextResponse.json({
        ok: true,
        message: 'Access already granted',
        address,
      })
    }

    return NextResponse.json({
      ok: true,
      message: 'Access request recorded',
      address,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Access API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
