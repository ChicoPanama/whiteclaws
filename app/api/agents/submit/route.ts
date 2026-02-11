import { NextRequest, NextResponse } from 'next/server'
import { authenticateAgent } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/submit
 *
 * Agent submits a vulnerability finding.
 * Requires API key auth via Authorization: Bearer wc_live_xxx
 *
 * Body: {
 *   protocol_slug: string     — target protocol
 *   title: string             — finding title
 *   severity: "critical" | "high" | "medium" | "low"
 *   description?: string      — plaintext summary (optional)
 *   encrypted_report?: {      — NaCl-encrypted full report
 *     ciphertext: string
 *     nonce: string
 *     sender_public_key: string
 *   }
 *   proof_of_concept?: string — PoC code or reference
 *   chain?: string            — chain where vuln exists
 *   contract_address?: string — affected contract
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate agent
    const agent = await authenticateAgent(req)
    if (!agent) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide API key via Authorization: Bearer wc_live_xxx' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { protocol_slug, title, severity, description, encrypted_report, proof_of_concept, chain, contract_address } = body

    // Validate required fields
    if (!protocol_slug || typeof protocol_slug !== 'string') {
      return NextResponse.json({ error: 'protocol_slug is required' }, { status: 400 })
    }
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }
    if (!['critical', 'high', 'medium', 'low'].includes(severity)) {
      return NextResponse.json({ error: 'severity must be critical, high, medium, or low' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Look up protocol
    const { data: protocol } = await supabase
      .from('protocols')
      .select('id, slug, name')
      .eq('slug', protocol_slug)
      .single()

    if (!protocol) {
      return NextResponse.json({ error: `Protocol '${protocol_slug}' not found` }, { status: 404 })
    }

    // Store encrypted report if provided
    const encrypted_url = encrypted_report
      ? JSON.stringify(encrypted_report)
      : description || ''

    // Create finding
    const { data: finding, error } = await supabase
      .from('findings')
      .insert({
        protocol_id: protocol.id,
        researcher_id: agent.id,
        agent_id: agent.id,
        title,
        severity,
        encrypted_report_url: encrypted_url,
        status: 'submitted',
      })
      .select('id, status, created_at')
      .single()

    if (error) throw error

    // Update agent stats
    await supabase.rpc('increment_agent_submissions', { agent_user_id: agent.id }).catch(() => {
      // Fallback: manual update if RPC doesn't exist
      supabase
        .from('agent_rankings')
        .update({
          total_submissions: supabase.rpc ? undefined : 0, // Will be updated by trigger
        })
        .eq('agent_id', agent.id)
    })

    // Manual stats update (safe fallback)
    const { data: currentRanking } = await supabase
      .from('agent_rankings')
      .select('total_submissions')
      .eq('agent_id', agent.id)
      .single()

    if (currentRanking) {
      await supabase
        .from('agent_rankings')
        .update({ total_submissions: (currentRanking.total_submissions || 0) + 1 })
        .eq('agent_id', agent.id)
    }

    return NextResponse.json({
      finding: {
        id: finding.id,
        protocol: protocol.slug,
        title,
        severity,
        status: finding.status,
        submitted_at: finding.created_at,
      },
      agent: agent.handle,
      message: 'Finding submitted successfully.',
    }, { status: 201 })
  } catch (error) {
    console.error('Agent submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
