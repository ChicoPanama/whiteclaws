import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bounties — list active bounty programs
 * Public endpoint. Primary discovery for agents.
 * Filters: ?chain=base&min_bounty=1000&max_bounty=1000000&category=DeFi&limit=50
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const chain = searchParams.get('chain')
  const minBounty = searchParams.get('min_bounty')
  const maxBounty = searchParams.get('max_bounty')
  const category = searchParams.get('category')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')

  const supabase = createClient()

  let query = supabase
    .from('programs')
    .select(`
      id, status, poc_required, kyc_required, payout_currency, min_payout, max_payout,
      scope_version, cooldown_hours, created_at,
      protocol:protocol_id (slug, name, description, category, chains, max_bounty, logo_url)
    `)
    .eq('status', 'active')
    .order('max_payout', { ascending: false })
    .range(offset, offset + limit - 1)

  if (minBounty) query = query.gte('max_payout', parseInt(minBounty))
  if (maxBounty) query = query.lte('max_payout', parseInt(maxBounty))

  const { data: programs, error } = await query
  if (error) throw error

  let results = (programs || []).map((p: any) => ({
    program_id: p.id,
    slug: p.protocol?.slug,
    name: p.protocol?.name,
    description: p.protocol?.description,
    category: p.protocol?.category,
    chains: p.protocol?.chains || [],
    logo_url: p.protocol?.logo_url,
    max_bounty: Number(p.max_payout),
    min_bounty: Number(p.min_payout),
    payout_currency: p.payout_currency,
    poc_required: p.poc_required,
    kyc_required: p.kyc_required,
    scope_version: p.scope_version,
    cooldown_hours: p.cooldown_hours,
  }))

  // Client-side filters for chain and category (Supabase can't filter nested JSONB arrays easily)
  if (chain) {
    results = results.filter((r: any) => r.chains.includes(chain.toLowerCase()))
  }
  if (category) {
    results = results.filter((r: any) => r.category?.toLowerCase().includes(category.toLowerCase()))
  }

  return NextResponse.json({
    bounties: results,
    count: results.length,
    offset,
    limit,
  })
}
