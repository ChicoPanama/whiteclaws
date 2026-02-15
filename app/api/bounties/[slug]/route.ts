import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()

    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('id, slug, name, description, category, chains, max_bounty, logo_url, website_url, github_url')
      .eq('slug', params.slug)
      .returns<Row<'protocols'>[]>().maybeSingle()

    if (protocolError) throw protocolError
    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('protocol_id', protocol.id)
      .eq('status', 'active')
      .returns<Row<'programs'>[]>().maybeSingle()

    if (programError) throw programError
    if (!program) return NextResponse.json({ error: 'No active bounty program' }, { status: 404 })

    const { data: scope, error: scopeError } = await supabase
      .from('program_scopes')
      .select('*')
      .eq('program_id', program.id)
      .order('version', { ascending: false })
      .limit(1)
      .returns<Row<'program_scopes'>[]>().maybeSingle()

    if (scopeError) throw scopeError

    const { count: totalFindings, error: countError1 } = await supabase
      .from('findings')
      .select('id', { count: 'exact', head: true })
      .eq('protocol_id', protocol.id)

    if (countError1) throw countError1

    const { count: acceptedFindings, error: countError2 } = await supabase
      .from('findings')
      .select('id', { count: 'exact', head: true })
      .eq('protocol_id', protocol.id)
      .in('status', ['accepted', 'paid'])

    if (countError2) throw countError2

    return NextResponse.json({
      protocol: {
        slug: protocol.slug, name: protocol.name, description: protocol.description,
        category: protocol.category, chains: protocol.chains, logo_url: protocol.logo_url,
        website: protocol.website_url, github: protocol.github_url,
      },
      program: {
        id: program.id, status: program.status, poc_required: program.poc_required,
        kyc_required: program.kyc_required, payout_currency: program.payout_currency,
        min_payout: Number(program.min_payout), max_payout: Number(program.max_payout),
        duplicate_policy: program.duplicate_policy, response_sla_hours: program.response_sla_hours,
        cooldown_hours: program.cooldown_hours, exclusions: program.exclusions,
        encryption_public_key: program.encryption_public_key,
      },
      scope: scope ? {
        version: scope.version, contracts: scope.contracts,
        in_scope: scope.in_scope, out_of_scope: scope.out_of_scope,
        severity_definitions: scope.severity_definitions,
      } : null,
      stats: { total_findings: totalFindings || 0, accepted_findings: acceptedFindings || 0 },
    })
  } catch (error) {
    console.error('Bounty detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
