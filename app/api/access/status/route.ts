import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if wallet exists in users table
    const { data: user } = await supabase
      .from('users')
      .select('id, wallet_address, is_agent')
      .eq('wallet_address', address)
      .single()

    // Open beta: any registered wallet gets access
    const hasAccess = !!user

    return NextResponse.json({
      address,
      hasAccess,
      isValidated: hasAccess,
      expiry: null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
