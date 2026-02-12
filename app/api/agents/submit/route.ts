import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { emitParticipationEvent, checkSubmissionQuality, checkAndAwardStreak } from '@/lib/services/points-engine'
import { notifyProtocolAboutFinding } from '@/lib/services/notifications'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/submit
 * Submit a vulnerability finding.
 * 
 * Flow: Quality check → Store encrypted → Notify protocol → Award points → Route to Immunefi
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

    // ── 1. Quality check (anti-spam) ──
    const quality = await checkSubmissionQuality({
      user_id: auth.userId!,
      title,
      description,
      protocol_slug,
    })

    if (!quality.ok) {
      return NextResponse.json({
        error: quality.reason,
        points_impact: 'Repeated low-quality submissions will result in point deductions.',
      }, { status: 429 })
    }

    // ── 2. Resolve protocol + program ──
    const { data: protocol } = await supabase
      .from('protocols')
      .select('id, slug, name, immunefi_url')
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

    // Check cooldown
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
        error: `Cooldown active. You submitted to ${protocol_slug} within the last ${program.cooldown_hours}h.`,
        last_submission: recentSubmission.created_at,
      }, { status: 429 })
    }

    // ── 3. Store finding (encrypted) ──
    const { data: finding, error: insertError } = await supabase
      .from('findings')
      .insert({
        protocol_id: protocol.id,
        program_id: program.id,
        researcher_id: auth.userId,
        title,
        severity,
        description: description || null,
        scope_version: scope_version || program.scope_version,
        encrypted_report: encrypted_report || null,
        poc_url: poc_url || null,
        status: 'submitted',
        submission_source: 'whiteclaws',
      })
      .select('id, title, severity, status, scope_version, created_at')
      .single()

    if (insertError) throw insertError

    // ── 4. Award points ──
    // Get wallet address for points
    const { data: userRow } = await supabase.from('users').select('wallet_address').eq('id', auth.userId).single()
    const walletAddr = userRow?.wallet_address || undefined
    const pointsAwarded: Array<{ event: string; points: number }> = []

    // Base submission points (low — real value comes from acceptance)
    const submitResult = await emitParticipationEvent({
      user_id: auth.userId!,
      event_type: 'finding_submitted',
      metadata: { protocol_slug, severity, finding_id: finding.id },
      wallet_address: walletAddr,
      finding_id: finding.id,
    })
    if (submitResult.success) pointsAwarded.push({ event: 'finding_submitted', points: submitResult.points })

    // Encrypted report bonus
    if (encrypted_report) {
      const encResult = await emitParticipationEvent({
        user_id: auth.userId!,
        event_type: 'encrypted_report',
        metadata: { finding_id: finding.id },
        wallet_address: walletAddr,
        finding_id: finding.id,
      })
      if (encResult.success) pointsAwarded.push({ event: 'encrypted_report', points: encResult.points })
    }

    // PoC bonus
    if (poc_url) {
      const pocResult = await emitParticipationEvent({
        user_id: auth.userId!,
        event_type: 'poc_provided',
        metadata: { finding_id: finding.id, poc_url },
        wallet_address: walletAddr,
        finding_id: finding.id,
      })
      if (pocResult.success) pointsAwarded.push({ event: 'poc_provided', points: pocResult.points })
    }

    // Check streaks
    await checkAndAwardStreak(auth.userId!)

    // ── 5. Notify protocol + route to Immunefi ──
    const notification = await notifyProtocolAboutFinding({
      finding_id: finding.id,
      protocol_id: protocol.id,
      protocol_name: protocol.name,
      severity,
      submitted_at: finding.created_at,
    })

    // ── 6. Response ──
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
      },
      points: {
        awarded: pointsAwarded,
        total: pointsAwarded.reduce((s, p) => s + p.points, 0),
        note: 'Submission earns base points. Accepted findings earn 100x more.',
      },
      notification: {
        email_sent: notification.email_sent,
        recipient: notification.recipient ? notification.recipient.replace(/(.{2}).*@/, '$1***@') : null,
      },
      immunefi_route: notification.immunefi_url ? {
        url: notification.immunefi_url,
        action: 'Submit to Immunefi for formal triage and payout mediation.',
      } : null,
      message: 'Finding stored on WhiteClaws. Protocol notified.',
    }, { status: 201 })
  } catch (error) {
    console.error('Agent submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
