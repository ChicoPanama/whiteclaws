import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const adminKey = process.env.ADMIN_API_KEY
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { wallet_address, decision, reviewer } = body

    if (!wallet_address || !decision) {
      return NextResponse.json({ error: 'wallet_address and decision required' }, { status: 400 })
    }

    if (!['approve', 'reject', 'flag'].includes(decision)) {
      return NextResponse.json({ error: 'decision must be approve, reject, or flag' }, { status: 400 })
    }

    const supabase = createClient()

    let newScore: number
    switch (decision) {
      case 'approve':
        newScore = 0.0
        break
      case 'reject':
        newScore = 1.0
        break
      case 'flag':
        newScore = 0.6
        break
      default:
        newScore = 0.5
    }

    const { error } = await (supabase
      .from('anti_sybil_flags')
      .update({
        risk_score: newScore,
        reviewed: true,
        reviewed_by: reviewer || 'admin',
        updated_at: new Date().toISOString(),
      })
      .eq('wallet_address', wallet_address))

    if (error) throw error

    // Update contribution_scores sybil_multiplier
    const multiplier = newScore >= 0.8 ? 0.0 : newScore >= 0.5 ? 0.25 : newScore >= 0.2 ? 0.75 : 1.0

    // Find user by wallet and update their score multiplier
    const { data: user } = await (supabase
      .from('users')
      .select('id')
      .eq('wallet_address', wallet_address)
      .maybeSingle())

    if (user) {
      await (supabase
        .from('contribution_scores')
        .update({ sybil_multiplier: multiplier, updated_at: new Date().toISOString() })
        .eq('user_id', user.id))
    }

    return NextResponse.json({
      ok: true,
      wallet_address,
      decision,
      new_risk_score: newScore,
      new_multiplier: multiplier,
    })
  } catch (error) {
    console.error('Admin sybil review error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
