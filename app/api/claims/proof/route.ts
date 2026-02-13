import { NextRequest, NextResponse } from 'next/server'
import { getUserProof } from '@/lib/claims/merkle'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')
    const season = parseInt(searchParams.get('season') || '1')

    if (!address) {
      return NextResponse.json({ error: 'address parameter required' }, { status: 400 })
    }

    const result = await getUserProof(address, season)

    if (!result.eligible) {
      return NextResponse.json({
        eligible: false,
        error: result.error || 'Not eligible for this season',
      }, { status: 404 })
    }

    return NextResponse.json({
      eligible: true,
      wallet: address,
      season,
      amount: result.amount,
      proof: result.proof,
    })
  } catch (error) {
    console.error('Claims proof error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
