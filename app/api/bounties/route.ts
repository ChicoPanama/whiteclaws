import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bounties
 * List active bounty programs. Primary discovery endpoint for agents.
 * Filters: ?chain=base&min_bounty=1000&max_bounty=100000&category=DeFi&limit=50
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const chain = searchParams.get('chain')
    const minBounty = searchParams.get('min_bounty')
    const maxBounty = searchParams.get('max_bounty')
    const category = searchParams.get('category')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createClient()

    // Get active programs joined with protocols
    let query = supabase
      .from('programs')
      .select(`
        id, status, scope_version, poc_required, kyc_required, payout_currency,
        min_payout, max_payout, duplicate_policy, cooldown_hours,
        protocols!inner (
          id, slug, name, description, category, chains, max_bounty, logo_url, website_url
        )
      `)
      .eq('status', 'active')
      .order('max_payout', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: programs, error } = await query

    if (error) throw error

    let results = (programs || []).map((p: any) => {
      const proto = p.protocols
      return {
        slug: proto.slug,
        name: proto.name,
        description: proto.description,
        category: proto.category,
        chains: proto.chains,
        logo_url: proto.logo_url,
        website_url: proto.website_url,
        max_bounty: p.max_payout,
        min_bounty: p.min_payout,
        payout_currency: p.payout_currency,
        poc_required: p.poc_required,
        kyc_required: p.kyc_required,
        scope_version: p.scope_version,
        duplicate_policy: p.duplicate_policy,
        cooldown_hours: p.cooldown_hours,
      }
    })

    // Client-side filters (Supabase array contains is limited)
    if (chain) {
      results = results.filter((r: any) => r.chains?.includes(chain.toLowerCase()))
    }
    if (minBounty) {
      results = results.filter((r: any) => r.max_bounty >= parseInt(minBounty))
    }
    if (maxBounty) {
      results = results.filter((r: any) => r.max_bounty <= parseInt(maxBounty))
    }
    if (category) {
      results = results.filter((r: any) =>
        r.category?.toLowerCase().includes(category.toLowerCase()))
    }

    return NextResponse.json({
      bounties: results,
      count: results.length,
      offset,
      limit,
    })
  } catch (error) {
    console.error('Bounties list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
