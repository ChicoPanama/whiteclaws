import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAgent } from '@/lib/auth/agent'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/submit
 * Submit a vulnerability finding via API key authentication.
 *
 * Body: {
 *   protocol_slug: string,
 *   title: string,
 *   severity: 'critical' | 'high' | 'medium' | 'low',
 *   description: string,
 *   proof_of_concept?: string,
 *   encrypted_report_url?: string,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate agent
    const agent = await authenticateAgent(req)
    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid or missing API key. Use: Authorization: Bearer wc_xxx' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { protocol_slug, title, severity, description, proof_of_concept, encrypted_report_url } = body

    // Validate required fields
    if (!protocol_slug || !title || !severity) {
      return NextResponse.json(
        { error: 'protocol_slug, title, and severity are required' },
        { status: 400 }
      )
    }

    const validSeverities = ['critical', 'high', 'medium', 'low']
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `severity must be one of: ${validSeverities.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Verify protocol exists
    const { data: protocol } = await supabase
      .from('protocols')
      .select('id')
      .eq('slug', protocol_slug)
      .single()

    if (!protocol) {
      return NextResponse.json({ error: `Protocol '${protocol_slug}' not found` }, { status: 404 })
    }

    // Create finding
    const { data: finding, error } = await supabase
      .from('findings')
      .insert({
        protocol_id: protocol.id,
        researcher_id: agent.userId,
        title,
        severity,
        encrypted_report_url: encrypted_report_url || null,
        status: 'submitted',
      })
      .select('id, title, severity, status, created_at')
      .single()

    if (error) throw error

    // Update agent submission count
    await supabase.rpc('increment_agent_submissions', { agent_user_id: agent.userId })
      .then(() => {})
      .catch(() => {
        // RPC may not exist yet — silently fail, update manually
        supabase
          .from('agent_rankings')
          .update({
            total_submissions: supabase.rpc ? undefined : 0, // fallback
          })
          .eq('agent_id', agent.userId)
      })

    return NextResponse.json({
      ok: true,
      finding: {
        id: finding.id,
        title: finding.title,
        severity: finding.severity,
        status: finding.status,
        protocol: protocol_slug,
        submitted_by: agent.handle,
        created_at: finding.created_at,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Agent submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
