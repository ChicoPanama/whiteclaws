import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/submit
 * Submit a vulnerability finding. Requires API key auth.
 * Body: {
 *   protocol_slug, title, severity, scope_version?,
 *   description?, encrypted_report?, poc_url?
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Use Authorization: Bearer wc_xxx_yyy' },
        { status: 401 }
      )
    }

    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 })
    if (!auth.scopes?.includes('agent:submit')) {
      return NextResponse.json({ error: 'API key lacks agent:submit scope' }, { status: 403 })
    }

    const body = await req.json()
    const { protocol_slug, title, severity, scope_version, description, encrypted_report, poc_url } = body

    if (!protocol_slug) return NextResponse.json({ error: 'protocol_slug required' }, { status: 400 })
    if (!title || title.length < 5) return NextResponse.json({ error: 'title required (min 5 chars)' }, { status: 400 })
    if (!['critical', 'high', 'medium', 'low'].includes(severity)) {
      return NextResponse.json({ error: 'severity must be critical|high|medium|low' }, { status: 400 })
    }

    const supabase = createClient()

    // Resolve protocol
    const { data: protocol } = await supabase
      .from('protocols').select('id, slug, name').eq('slug', protocol_slug).maybeSingle()
    if (!protocol) return NextResponse.json({ error: `Protocol '${protocol_slug}' not found` }, { status: 404 })

    // Check for active program
    const { data: program } = await supabase
      .from('programs').select('id, status, scope_version, cooldown_hours, poc_required')
      .eq('protocol_id', protocol.id).maybeSingle()

    if (program && program.status !== 'active') {
      return NextResponse.json({ error: 'Bounty program is not active' }, { status: 400 })
    }

    // Cooldown check — one submission per protocol per cooldown period
    if (program?.cooldown_hours) {
      const cooldownSince = new Date(Date.now() - program.cooldown_hours * 3600 * 1000).toISOString()
      const { count } = await supabase
        .from('findings')
        .select('id', { count: 'exact', head: true })
        .eq('researcher_id', auth.userId)
        .eq('protocol_id', protocol.id)
        .gte('created_at', cooldownSince)

      if ((count || 0) > 0) {
        return NextResponse.json({
          error: `Cooldown active. You can submit again to ${protocol_slug} in ${program.cooldown_hours}h.`,
        }, { status: 429 })
      }
    }

    // Insert finding
    const { data: finding, error: insertError } = await supabase
      .from('findings')
      .insert({
        protocol_id: protocol.id,
        program_id: program?.id || null,
        researcher_id: auth.userId,
        title,
        severity,
        description: description || null,
        scope_version: scope_version || program?.scope_version || null,
        encrypted_report: encrypted_report || null,
        poc_url: poc_url || null,
        status: 'submitted',
      })
      .select('id, title, severity, status, created_at')
      .single()

    if (insertError) throw insertError

    // Increment agent submission count
    const { data: ranking } = await supabase
      .from('agent_rankings')
      .select('total_submissions')
      .eq('agent_id', auth.userId)
      .maybeSingle()

    if (ranking) {
      await supabase.from('agent_rankings')
        .update({ total_submissions: (ranking.total_submissions || 0) + 1 })
        .eq('agent_id', auth.userId)
    }

    return NextResponse.json({
      finding: {
        id: finding.id,
        protocol: protocol.slug,
        protocol_name: protocol.name,
        title: finding.title,
        severity: finding.severity,
        status: finding.status,
        created_at: finding.created_at,
      },
      message: 'Finding submitted. It will be triaged by the protocol team.',
    }, { status: 201 })
  } catch (error) {
    console.error('Agent submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
