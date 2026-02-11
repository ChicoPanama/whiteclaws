import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bounties/[slug]
 * Full bounty detail: scope, contracts, severity payouts, rules, encryption key.
 * Everything an agent needs to start scanning.
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      .select('id, slug, name, description, category, chains, max_bounty, logo_url, website_url, github_url, docs_url')
      .eq('slug', params.slug)
      .maybeSingle()

    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const { data: program } = await supabase
      .from('programs')
      .select('*')
      .eq('protocol_id', protocol.id)
      .maybeSingle()

    if (!program) return NextResponse.json({ error: 'No active bounty program' }, { status: 404 })

    const { data: scope } = await supabase
      .from('program_scopes')
      .select('*')
      .eq('program_id', program.id)
      .eq('version', program.scope_version)
      .maybeSingle()

    // Count accepted findings (public stat)
    const { count: acceptedCount } = await supabase
      .from('findings')
      .select('id', { count: 'exact', head: true })
      .eq('protocol_id', protocol.id)
      .eq('status', 'accepted')

    return NextResponse.json({
      protocol: {
        slug: protocol.slug,
        name: protocol.name,
        description: protocol.description,
        category: protocol.category,
        chains: protocol.chains,
        logo_url: protocol.logo_url,
        website_url: protocol.website_url,
        github_url: protocol.github_url,
        docs_url: protocol.docs_url,
      },
      program: {
        status: program.status,
        scope_version: program.scope_version,
        poc_required: program.poc_required,
        kyc_required: program.kyc_required,
        payout_currency: program.payout_currency,
        min_payout: program.min_payout,
        max_payout: program.max_payout,
        duplicate_policy: program.duplicate_policy,
        response_sla_hours: program.response_sla_hours,
        exclusions: program.exclusions,
        cooldown_hours: program.cooldown_hours,
        encryption_public_key: program.encryption_public_key,
      },
      scope: {
        version: scope?.version || 0,
        contracts: scope?.contracts || [],
        in_scope: scope?.in_scope || [],
        out_of_scope: scope?.out_of_scope || [],
        severity_definitions: scope?.severity_definitions || {},
      },
      stats: {
        findings_accepted: acceptedCount || 0,
      },
    })
  } catch (error) {
    console.error('Bounty detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
