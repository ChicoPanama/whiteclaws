import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bounties — list active bounty programs
 * Public endpoint. Primary discovery for agents.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const chain = searchParams.get('chain')
  const minBounty = searchParams.get('min_bounty')
  const maxBounty = searchParams.get('max_bounty')
  const category = searchParams.get('category')
  const hasContracts = searchParams.get('has_contracts')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')

  const supabase = createClient()

  // Get programs with protocol data via join
  let query = supabase
    .from('programs')
    .select('id, status, poc_required, kyc_required, payout_currency, min_payout, max_payout, scope_version, cooldown_hours, created_at, protocol_id')
    .eq('status', 'active')
    .order('max_payout', { ascending: false })
    .range(offset, offset + limit - 1)

  if (minBounty) query = query.gte('max_payout', parseInt(minBounty))
  if (maxBounty) query = query.lte('max_payout', parseInt(maxBounty))

  const { data: programs, error } = await query
  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 })

  if (!programs || programs.length === 0) {
    return NextResponse.json({ bounties: [], count: 0, offset, limit })
  }

  // Fetch protocol details for these programs
  const protocolIds = [...new Set(programs.map(p => p.protocol_id))]
  const { data: protocols } = await supabase
    .from('protocols')
    .select('id, slug, name, description, category, chains, max_bounty, logo_url, contracts')
    .in('id', protocolIds)

  const protoMap = new Map((protocols || []).map(p => [p.id, p]))

  // If has_contracts filter, also fetch scope data to check for contracts
  let scopeMap = new Map<string, boolean>()
  if (hasContracts === 'true') {
    const programIds = programs.map(p => p.id)
    const { data: scopes } = await supabase
      .from('program_scopes')
      .select('program_id, contracts')
      .in('program_id', programIds)
    for (const s of scopes || []) {
      const hasAny = Array.isArray(s.contracts) && s.contracts.length > 0
      scopeMap.set(s.program_id, hasAny)
    }
  }

  let results = programs.map(p => {
    const proto = protoMap.get(p.protocol_id)
    return {
      program_id: p.id,
      slug: proto?.slug,
      name: proto?.name,
      description: proto?.description,
      category: proto?.category,
      chains: proto?.chains || [],
      logo_url: proto?.logo_url,
      max_bounty: Number(p.max_payout),
      min_bounty: Number(p.min_payout),
      payout_currency: p.payout_currency,
      poc_required: p.poc_required,
      kyc_required: p.kyc_required,
      scope_version: p.scope_version,
      cooldown_hours: p.cooldown_hours,
    }
  })

  if (chain) {
    results = results.filter(r => (r.chains as string[]).includes(chain.toLowerCase()))
  }
  if (category) {
    results = results.filter(r => r.category?.toLowerCase().includes(category.toLowerCase()))
  }
  if (hasContracts === 'true') {
    results = results.filter(r => scopeMap.get(r.program_id) === true)
  }

  return NextResponse.json({ bounties: results, count: results.length, offset, limit })
}
