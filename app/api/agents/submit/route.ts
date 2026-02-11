import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/submit
 * Submit a vulnerability finding. Requires API key auth.
 * Body: {
 *   protocol_slug, title, severity, scope_version?,
 *   description?, encrypted_report?: { ciphertext, nonce, sender_pubkey },
 *   poc_url?
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Missing API key. Use Authorization: Bearer wc_xxx' }, { status: 401 })

    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })
    if (!auth.scopes?.includes('agent:submit')) return NextResponse.json({ error: 'Missing agent:submit scope' }, { status: 403 })

    const body = await req.json()
    const { protocol_slug, title, severity, scope_version, description, encrypted_report, poc_url } = body

    if (!protocol_slug) return NextResponse.json({ error: 'protocol_slug is required' }, { status: 400 })
    if (!title || title.length < 5) return NextResponse.json({ error: 'title is required (min 5 chars)' }, { status: 400 })
    if (!['critical', 'high', 'medium', 'low'].includes(severity)) {
      return NextResponse.json({ error: 'severity must be critical, high, medium, or low' }, { status: 400 })
    }

    const supabase = createClient()

    // Resolve protocol + active program
    const { data: protocol } = await supabase
      .from('protocols')
      .select('id, slug, name')
      .eq('slug', protocol_slug)
      .maybeSingle()

    if (!protocol) return NextResponse.json({ error: `Protocol '${protocol_slug}' not found` }, { status: 404 })

    const { data: program } = await supabase
      .from('programs')
      .select('id, status, scope_version, poc_required, cooldown_hours')
      .eq('protocol_id', protocol.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!program) return NextResponse.json({ error: 'No active bounty program for this protocol' }, { status: 404 })

    // Validate scope_version if provided
    if (scope_version && scope_version !== program.scope_version) {
      const { data: scopeExists } = await supabase
        .from('program_scopes')
        .select('version')
        .eq('program_id', program.id)
        .eq('version', scope_version)
        .maybeSingle()

      if (!scopeExists) {
        return NextResponse.json({
          error: `Invalid scope_version ${scope_version}. Current version is ${program.scope_version}.`,
          current_scope_version: program.scope_version,
        }, { status: 400 })
      }
    }

    // Check PoC requirement
    if (program.poc_required && !poc_url && !encrypted_report) {
      return NextResponse.json({ error: 'This program requires a proof of concept (poc_url or encrypted_report)' }, { status: 400 })
    }

    // Check cooldown — agent can't submit to same protocol within cooldown_hours
    const cooldownDate = new Date(Date.now() - (program.cooldown_hours || 24) * 3600000).toISOString()
    const { data: recentSubmission } = await supabase
      .from('findings')
      .select('id, created_at')
      .eq('researcher_id', auth.userId)
      .eq('protocol_id', protocol.id)
      .gte('created_at', cooldownDate)
      .limit(1)
      .maybeSingle()

    if (recentSubmission) {
      return NextResponse.json({
        error: `Cooldown active. You submitted to ${protocol_slug} within the last ${program.cooldown_hours}h. Try again later.`,
        last_submission: recentSubmission.created_at,
      }, { status: 429 })
    }

    // Check for duplicate title (basic)
    const { data: duplicate } = await supabase
      .from('findings')
      .select('id, title')
      .eq('protocol_id', protocol.id)
      .ilike('title', title)
      .limit(1)
      .maybeSingle()

    // Insert finding
    const { data: finding, error: insertError } = await supabase
      .from('findings')
      .insert({
        protocol_id: protocol.id,
        program_id: program.id,
        researcher_id: auth.userId,
        title,
        severity,
        scope_version: scope_version || program.scope_version,
        encrypted_report: encrypted_report || null,
        poc_url: poc_url || null,
        status: 'submitted',
      })
      .select('id, title, severity, status, scope_version, created_at')
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      finding: {
        id: finding.id,
        protocol: protocol.slug,
        protocol_name: protocol.name,
        title: finding.title,
        severity: finding.severity,
        status: finding.status,
        scope_version: finding.scope_version,
        created_at: finding.created_at,
        possible_duplicate: duplicate ? { id: duplicate.id, title: duplicate.title } : null,
      },
      message: 'Finding submitted. It will be triaged by the protocol team.',
    }, { status: 201 })
  } catch (error) {
    console.error('Agent submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
