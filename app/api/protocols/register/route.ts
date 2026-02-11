import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { generateApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/protocols/register
 * Protocol team registers their project. Creates protocol + program + owner membership.
 * Body: { name, slug, website_url?, github_url?, contact_email, chains[], max_bounty?, description? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, website_url, github_url, contact_email, chains, max_bounty, description } = body

    if (!name || !slug || !contact_email) {
      return NextResponse.json({ error: 'name, slug, and contact_email are required' }, { status: 400 })
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
    const supabase = createClient()

    // Check duplicate slug
    const { data: existing } = await supabase
      .from('protocols')
      .select('id')
      .eq('slug', cleanSlug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Protocol slug already registered' }, { status: 409 })
    }

    // Create owner user (or link to existing wallet user later via Privy)
    const { data: owner, error: ownerErr } = await supabase
      .from('users')
      .insert({
        handle: `protocol_${cleanSlug}`,
        display_name: `${name} Team`,
        is_agent: false,
        status: 'active',
      })
      .select('id')
      .single()

    if (ownerErr) throw ownerErr

    // Create protocol
    const { data: protocol, error: protoErr } = await supabase
      .from('protocols')
      .insert({
        slug: cleanSlug,
        name,
        description: description || `${name} bug bounty program on WhiteClaws`,
        category: 'DeFi',
        chains: chains || ['ethereum'],
        max_bounty: max_bounty || 100000,
        website_url,
        github_url,
        contact_email,
        owner_id: owner.id,
        verified: false,
      })
      .select('id, slug, name')
      .single()

    if (protoErr) throw protoErr

    // Create protocol_member (owner role)
    await supabase.from('protocol_members').insert({
      protocol_id: protocol.id,
      user_id: owner.id,
      role: 'owner',
    })

    // Create default program
    const { data: program } = await supabase
      .from('programs')
      .insert({
        protocol_id: protocol.id,
        status: 'active',
        max_payout: max_bounty || 100000,
        min_payout: 500,
        payout_currency: 'USDC',
        poc_required: true,
      })
      .select('id')
      .single()

    // Create initial scope v1
    if (program) {
      await supabase.from('program_scopes').insert({
        program_id: program.id,
        version: 1,
        in_scope: ['Smart contracts — define specific scope after registration'],
        out_of_scope: ['Frontend applications', 'Off-chain infrastructure'],
        severity_definitions: {
          critical: { min: Math.floor((max_bounty || 100000) * 0.25), max: max_bounty || 100000, description: 'Direct theft of user funds or protocol insolvency' },
          high: { min: 1000, max: Math.floor((max_bounty || 100000) * 0.1), description: 'Temporary freezing of funds or manipulation' },
          medium: { min: 500, max: 1000, description: 'Griefing or protocol disruption' },
          low: { min: 100, max: 500, description: 'Informational or best practice issues' },
        },
      })
    }

    // Generate API key for protocol management
    const { key, keyPrefix } = await generateApiKey(owner.id, 'protocol-admin', [
      'protocol:read', 'protocol:write', 'protocol:triage',
    ])

    return NextResponse.json({
      protocol: { id: protocol.id, slug: protocol.slug, name: protocol.name },
      program_id: program?.id,
      api_key: key,
      api_key_prefix: keyPrefix,
      message: 'Protocol registered. Save your API key — it will not be shown again. Update your scope at PATCH /api/protocols/' + cleanSlug + '/scope',
    }, { status: 201 })
  } catch (error) {
    console.error('Protocol registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
