import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { generateApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/protocols/register
 * Protocol team registers their project. Creates protocol + program + owner membership + API key.
 * Body: { name, slug?, website_url?, github_url?, docs_url?, contact_email?, chains?[], category?, max_bounty?, logo_url? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, website_url, github_url, docs_url, contact_email, chains, category, max_bounty, logo_url } = body

    if (!name || typeof name !== 'string' || name.length < 2) {
      return NextResponse.json({ error: 'name is required (min 2 chars)' }, { status: 400 })
    }

    const slug = (body.slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    if (!slug) {
      return NextResponse.json({ error: 'Could not generate valid slug' }, { status: 400 })
    }

    const supabase = createClient()

    // Check duplicate slug
    const { data: existing } = await supabase
      .from('protocols')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: `Protocol slug '${slug}' already exists` }, { status: 409 })
    }

    // Create user for protocol owner
    const { data: owner, error: ownerErr } = await supabase
      .from('users')
      .insert({
        handle: `protocol_${slug}`,
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
        slug,
        name,
        description: body.description || `${name} bug bounty program on WhiteClaws`,
        category: category || 'DeFi',
        chains: Array.isArray(chains) ? chains : ['ethereum'],
        max_bounty: max_bounty || 100000,
        logo_url: logo_url || null,
        website_url: website_url || null,
        github_url: github_url || null,
        docs_url: docs_url || null,
        contact_email: contact_email || null,
        owner_id: owner.id,
        verified: false,
      })
      .select('id, slug, name')
      .single()

    if (protoErr) throw protoErr

    // Create protocol_members entry
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
        in_scope: body.in_scope || ['Smart contracts'],
        out_of_scope: body.out_of_scope || ['Frontend applications', 'Off-chain infrastructure'],
        severity_definitions: {
          critical: { min: Math.max(Math.floor((max_bounty || 100000) * 0.25), 1000), max: max_bounty || 100000, description: 'Direct theft of user funds or protocol insolvency' },
          high: { min: 1000, max: Math.max(Math.floor((max_bounty || 100000) * 0.1), 5000), description: 'Temporary freezing of funds or manipulation' },
          medium: { min: 500, max: 1000, description: 'Griefing or protocol disruption' },
          low: { min: 100, max: 500, description: 'Informational or best practice issues' },
        },
      })
    }

    // Generate API key for protocol team
    const { key, keyPrefix } = await generateApiKey(owner.id, 'protocol-admin', [
      'protocol:read', 'protocol:write', 'protocol:triage',
    ])

    return NextResponse.json({
      protocol: { id: protocol.id, slug: protocol.slug, name: protocol.name },
      program_id: program?.id,
      api_key: key,
      api_key_prefix: keyPrefix,
      message: 'Protocol registered. Save your API key — it will not be shown again.',
    }, { status: 201 })
  } catch (error) {
    console.error('Protocol registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
