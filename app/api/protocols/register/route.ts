import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { generateApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/protocols/register
 * Protocol team registers their project. Creates protocol, program, owner membership, and API key.
 * Body: { name, slug?, website_url?, github_url?, contact_email, chains?, category?, max_bounty?, payout_currency? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, website_url, github_url, docs_url, contact_email, chains, category, max_bounty, payout_currency, logo_url } = body

    if (!name || typeof name !== 'string' || name.length < 2) {
      return NextResponse.json({ error: 'name is required (min 2 chars)' }, { status: 400 })
    }
    if (!contact_email || !contact_email.includes('@')) {
      return NextResponse.json({ error: 'valid contact_email is required' }, { status: 400 })
    }

    const cleanSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    const supabase = createClient()

    // Check duplicate slug
    const { data: existing } = await supabase
      .from('protocols')
      .select('id')
      .eq('slug', cleanSlug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: `Protocol slug '${cleanSlug}' already exists` }, { status: 409 })
    }

    // Create owner user (or this could be linked to an existing wallet user later)
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
        description: `${name} bug bounty program on WhiteClaws`,
        category: category || 'DeFi',
        chains: Array.isArray(chains) ? chains : ['ethereum'],
        max_bounty: max_bounty || 100000,
        logo_url: logo_url || null,
        website_url: website_url || null,
        github_url: github_url || null,
        docs_url: docs_url || null,
        contact_email,
        verified: false,
        owner_id: owner.id,
      })
      .select('id, slug, name')
      .single()

    if (protoErr) throw protoErr

    // Create program
    const { data: program, error: progErr } = await supabase
      .from('programs')
      .insert({
        protocol_id: protocol.id,
        status: 'active',
        payout_currency: payout_currency || 'USDC',
        min_payout: 500,
        max_payout: max_bounty || 100000,
      })
      .select('id')
      .single()

    if (progErr) throw progErr

    // Create initial scope v1
    await supabase.from('program_scopes').insert({
      program_id: program.id,
      version: 1,
      in_scope: ['Smart contracts — define specific contracts via scope update'],
      out_of_scope: ['Frontend applications', 'Off-chain infrastructure'],
      severity_definitions: {
        critical: { min: Math.max(Math.floor((max_bounty || 100000) * 0.25), 1000), max: max_bounty || 100000, description: 'Direct theft of user funds or protocol insolvency' },
        high: { min: 1000, max: Math.max(Math.floor((max_bounty || 100000) * 0.1), 5000), description: 'Temporary freezing of funds or manipulation' },
        medium: { min: 500, max: 1000, description: 'Griefing or protocol disruption' },
        low: { min: 100, max: 500, description: 'Informational or best practice issues' },
      },
    })

    // Create owner membership
    await supabase.from('protocol_members').insert({
      protocol_id: protocol.id,
      user_id: owner.id,
      role: 'owner',
    })

    // Generate API key for protocol management
    const { key, keyPrefix } = await generateApiKey(owner.id, 'protocol-admin', [
      'protocol:read', 'protocol:write', 'protocol:triage',
    ])

    return NextResponse.json({
      protocol: { id: protocol.id, slug: protocol.slug, name: protocol.name },
      program_id: program.id,
      owner_id: owner.id,
      api_key: key,
      api_key_prefix: keyPrefix,
      message: 'Protocol registered. Save your API key — it will not be shown again. Next: update your scope via PATCH /api/protocols/' + cleanSlug + '/scope',
    }, { status: 201 })
  } catch (error) {
    console.error('Protocol registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
