import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { generateApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/protocols/register
 * Protocol team registers their project. Returns protocol + API key.
 * Body: { name, slug?, website_url?, github_url?, contact_email?, chains?, category?, logo_url?, description? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, website_url, github_url, contact_email, chains, category, logo_url, description } = body

    if (!name || typeof name !== 'string' || name.length < 2) {
      return NextResponse.json({ error: 'name is required (min 2 chars)' }, { status: 400 })
    }

    // Generate slug from name if not provided
    let slug = (body.slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    if (!slug) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })

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

    // Create a user for the protocol owner (or use existing from auth)
    const ownerHandle = `protocol_${slug}`
    const { data: owner, error: ownerErr } = await supabase
      .from('users')
      .insert({
        handle: ownerHandle,
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
        description: description || `${name} bug bounty program on WhiteClaws`,
        category: category || 'DeFi',
        chains: chains || ['ethereum'],
        max_bounty: 0,
        logo_url: logo_url || null,
        website_url: website_url || null,
        github_url: github_url || null,
        contact_email: contact_email || null,
        owner_id: owner.id,
        verified: false,
      })
      .select('id, slug, name')
      .single()

    if (protoErr) throw protoErr

    // Add owner to protocol_members
    await supabase.from('protocol_members').insert({
      protocol_id: protocol.id,
      user_id: owner.id,
      role: 'owner',
    })

    // Generate API key for protocol management
    const { key, keyPrefix } = await generateApiKey(owner.id, `${slug}-admin`, [
      'protocol:read', 'protocol:write', 'protocol:triage',
    ])

    return NextResponse.json({
      protocol: {
        id: protocol.id,
        slug: protocol.slug,
        name: protocol.name,
      },
      api_key: key,
      api_key_prefix: keyPrefix,
      message: 'Protocol registered. Save your API key — it will not be shown again. Next: create a bounty program with POST /api/protocols/' + slug + '/program',
    }, { status: 201 })
  } catch (error) {
    console.error('Protocol registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
