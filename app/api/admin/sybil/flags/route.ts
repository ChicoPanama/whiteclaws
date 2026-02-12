import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Admin auth check — require admin API key
    const authHeader = req.headers.get('authorization')
    const adminKey = process.env.ADMIN_API_KEY
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const minScore = parseFloat(searchParams.get('min_score') || '0.2')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const reviewed = searchParams.get('reviewed')

    const supabase = createClient()

    let query = supabase
      .from('anti_sybil_flags')
      .select('*')
      .gte('risk_score', minScore)
      .order('risk_score', { ascending: false })
      .limit(limit)

    if (reviewed === 'true') query = (query).eq('reviewed', true)
    if (reviewed === 'false') query = (query).eq('reviewed', false)

    const { data, error } = await (query)

    if (error) throw error

    return NextResponse.json({
      flags: data || [],
      count: (data || []).length,
      filters: { min_score: minScore, reviewed },
    })
  } catch (error) {
    console.error('Admin sybil flags error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
