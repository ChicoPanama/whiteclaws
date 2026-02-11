import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/submit
 * Submit a vulnerability finding as an authenticated agent.
 * Requires API key auth via Authorization: Bearer wc_xxx_yyy
 *
 * Body: {
 *   protocol_slug: string,
 *   title: string,
 *   severity: 'critical' | 'high' | 'medium' | 'low',
 *   description?: string,
 *   encrypted_report?: { ciphertext, nonce, senderPublicKey },
 *   proof_of_concept?: string,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate via API key
    const apiKey = extractApiKey(req)
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Use Authorization: Bearer wc_xxx_yyy' },
        { status: 401 }
      )
    }

    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error || 'Invalid API key' }, { status: 401 })
    }

    // Check scope
    if (!auth.scopes?.includes('agent:submit')) {
      return NextResponse.json({ error: 'API key lacks agent:submit scope' }, { status: 403 })
    }

    const body = await req.json()
    const { protocol_slug, title, severity, description, encrypted_report, proof_of_concept } = body

    // Validate
    if (!protocol_slug || typeof protocol_slug !== 'string') {
      return NextResponse.json({ error: 'protocol_slug is required' }, { status: 400 })
    }
    if (!title || typeof title !== 'string' || title.length < 5) {
      return NextResponse.json({ error: 'title is required (min 5 chars)' }, { status: 400 })
    }
    if (!['critical', 'high', 'medium', 'low'].includes(severity)) {
      return NextResponse.json(
        { error: 'severity must be critical, high, medium, or low' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Resolve protocol
    const { data: protocol } = await supabase
      .from('protocols')
      .select('id, slug, name')
      .eq('slug', protocol_slug)
      .maybeSingle()

    if (!protocol) {
      return NextResponse.json({ error: `Protocol '${protocol_slug}' not found` }, { status: 404 })
    }

    // Build encrypted report URL (or store inline)
    let encryptedReportUrl: string | null = null
    if (encrypted_report) {
      encryptedReportUrl = JSON.stringify(encrypted_report)
    }

    // Insert finding
    const { data: finding, error: insertError } = await supabase
      .from('findings')
      .insert({
        protocol_id: protocol.id,
        researcher_id: auth.userId,
        title,
        severity,
        encrypted_report_url: encryptedReportUrl,
        status: 'submitted',
      })
      .select('id, title, severity, status, created_at')
      .single()

    if (insertError) throw insertError

    // Update agent submission count
    await supabase.rpc('increment_submissions', { agent_user_id: auth.userId }).catch(() => {
      // RPC might not exist yet — update manually
      return supabase
        .from('agent_rankings')
        .update({
          total_submissions: supabase.rpc ? undefined : 0, // will be handled by trigger
        })
        .eq('agent_id', auth.userId)
    })

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
      message: 'Finding submitted successfully. It will be triaged by the protocol team.',
    }, { status: 201 })
  } catch (error) {
    console.error('Agent submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
