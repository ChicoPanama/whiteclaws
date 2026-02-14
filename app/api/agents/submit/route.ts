import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { emitParticipationEvent, checkSubmissionQuality, checkAndAwardStreak } from '@/lib/services/points-engine'
import { notifyProtocolAboutFinding } from '@/lib/services/notifications'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/submit
 * Submit a vulnerability finding.
 * 
 * Flow: Quality check → Store encrypted → Notify protocol → Award points → Route to Immunefi
 */
export async function POST(req: NextRequest) {
  try {
    // Auth: prefer Supabase session cookie; fall back to API key for agents.
    let userId: string | null = null
    let scopes: string[] | undefined
    let authMethod: 'session' | 'api_key' = 'api_key'

    const serverClient = createServerClient()
    const { data: sessionUser } = await serverClient.auth.getUser()
    if (sessionUser?.user?.id) {
      userId = sessionUser.user.id
      authMethod = 'session'
    } else {
      const apiKey = extractApiKey(req)
      if (!apiKey) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

      const auth = await verifyApiKey(apiKey)
      if (!auth.valid || !auth.userId) return NextResponse.json({ error: auth.error || 'Invalid key' }, { status: 401 })
      if (!auth.scopes?.includes('agent:submit')) return NextResponse.json({ error: 'Missing agent:submit scope' }, { status: 403 })

      userId = auth.userId
      scopes = auth.scopes
      authMethod = 'api_key'
    }

    const submitSchema = z.object({
      protocol_slug: z.string().min(1),
      title: z.string().min(5),
      severity: z.enum(['critical', 'high', 'medium', 'low']),
      scope_version: z.number().int().positive().optional(),
      description: z.string().max(50_000).optional().nullable(),
      poc_url: z.string().url().optional().nullable(),
      encrypted_report: z.union([
        z.object({
          ciphertext: z.string().min(1),
          nonce: z.string().min(1),
          sender_pubkey: z.string().min(1),
        }),
        z.object({
          ciphertext: z.string().min(1),
          nonce: z.string().min(1),
          senderPublicKey: z.string().min(1),
        }),
      ]).optional().nullable(),
    })

    const body = await req.json().catch(() => ({}))
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.issues }, { status: 400 })
    }

    const { protocol_slug, title, severity, scope_version, description, encrypted_report, poc_url } = parsed.data

    let normalizedEncryptedReport: { ciphertext: string; nonce: string; sender_pubkey: string } | null = null
    if (encrypted_report && typeof encrypted_report === 'object') {
      if ('senderPublicKey' in encrypted_report) {
        normalizedEncryptedReport = {
          ciphertext: encrypted_report.ciphertext,
          nonce: encrypted_report.nonce,
          sender_pubkey: encrypted_report.senderPublicKey,
        }
      } else if ('sender_pubkey' in encrypted_report) {
        normalizedEncryptedReport = encrypted_report
      }
    }

    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const supabase = createClient()

    // ── 1. Quality check (anti-spam) ──
    const quality = await checkSubmissionQuality({
      user_id: userId,
      title,
      description: description || undefined,
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
    if (program.poc_required && !poc_url && !normalizedEncryptedReport) {
      return NextResponse.json({ error: 'This program requires a proof of concept (poc_url or encrypted_report)' }, { status: 400 })
    }

    // Check cooldown
    const cooldownDate = new Date(Date.now() - (program.cooldown_hours || 24) * 3600000).toISOString()
    const { data: recentSubmission } = await supabase
      .from('findings')
      .select('id, created_at')
      .eq('researcher_id', userId)
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
        researcher_id: userId,
        title,
        severity,
        description: description || null,
        scope_version: scope_version || program.scope_version,
        encrypted_report: normalizedEncryptedReport,
        poc_url: poc_url || null,
        status: 'submitted',
        submission_source: 'whiteclaws',
      })
      .select('id, title, severity, status, scope_version, created_at')
      .single()

    if (insertError) throw insertError

    // ── 4. Award points ──
    // Get wallet address for points
    const { data: userRow } = await supabase.from('users').select('wallet_address').eq('id', userId).single()
    const walletAddr = userRow?.wallet_address || undefined
    const pointsAwarded: Array<{ event: string; points: number }> = []

    // Base submission points (low — real value comes from acceptance)
    const submitResult = await emitParticipationEvent({
      user_id: userId,
      event_type: 'finding_submitted',
      metadata: { protocol_slug, severity, finding_id: finding.id },
      wallet_address: walletAddr,
      finding_id: finding.id,
    })
    if (submitResult.success) pointsAwarded.push({ event: 'finding_submitted', points: submitResult.points })

    // Encrypted report bonus
    if (normalizedEncryptedReport) {
      const encResult = await emitParticipationEvent({
        user_id: userId,
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
        user_id: userId,
        event_type: 'poc_provided',
        metadata: { finding_id: finding.id, poc_url },
        wallet_address: walletAddr,
        finding_id: finding.id,
      })
      if (pocResult.success) pointsAwarded.push({ event: 'poc_provided', points: pocResult.points })
    }

    // Check streaks
    await checkAndAwardStreak(userId)

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
      auth: { method: authMethod, scopes: authMethod === 'api_key' ? (scopes || []) : [] },
      points: {
        awarded: pointsAwarded,
        total: pointsAwarded.reduce((s, p) => s + p.points, 0),
        note: 'Submission earns base points. Accepted findings earn 100x more.',
      },
      notification: {
        route: notification.route,
        email_sent: notification.email_sent,
        recipient: notification.recipient ? notification.recipient.replace(/(.{2}).*@/, '$1***@') : null,
      },
      immunefi_fallback: notification.route === 'immunefi' ? {
        url: notification.immunefi_url,
        action: 'No direct contact found. Submit to Immunefi for formal triage.',
      } : null,
      message: 'Finding stored on WhiteClaws. Protocol notified.',
    }, { status: 201 })
  } catch (error) {
    console.error('Agent submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
