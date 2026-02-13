import { NextRequest, NextResponse } from 'next/server'
import { getClaimStatus } from '@/lib/web3/contracts/airdrop-claim'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')
    const season = parseInt(searchParams.get('season') || '1')

    if (!address) {
      return NextResponse.json({ error: 'address parameter required' }, { status: 400 })
    }

    const status = await getClaimStatus(address, season)

    return NextResponse.json({
      wallet: address,
      season,
      ...status,
    })
  } catch (error) {
    console.error('Claims status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
