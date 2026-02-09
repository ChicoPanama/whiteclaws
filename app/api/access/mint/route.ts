import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { address } = body

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      txHash: '0x' + Array(64).fill('0').map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      message: 'Access request submitted successfully (stub)',
      address,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Access mint API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
