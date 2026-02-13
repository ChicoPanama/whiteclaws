/**
 * Behavioral Analysis — Layer 2 Sybil resistance.
 *
 * Analyzes API call patterns, submission quality, and session fingerprints.
 * Results update risk_score in anti_sybil_flags.
 */

import { createClient } from '@/lib/supabase/admin'
import type { Row } from '@/lib/supabase/helpers'

/**
 * Analyze submission quality — detect copy-paste or template-based reports.
 * Uses basic n-gram similarity check between new and existing findings.
 */
export async function checkSubmissionQuality(
  userId: string,
  submissionText: string
): Promise<{ score: number; flag?: string }> {
  if (!submissionText || submissionText.length < 50) {
    return { score: 0.3, flag: 'low_quality_submission' }
  }

  const supabase = createClient()

  // Get recent submissions from other users for similarity check
  const { data: recentFindings } = await (supabase
    .from('findings')
    .select('title, description')
    .neq('submitted_by', userId)
    .order('created_at', { ascending: false })
    .limit(50))

  if (!recentFindings || recentFindings.length === 0) return { score: 0 }

  // Simple trigram similarity
  const inputTrigrams = extractTrigrams(submissionText.toLowerCase())
  let maxSimilarity = 0

  for (const finding of recentFindings) {
    const existingText = `${finding.title || ''} ${finding.description || ''}`.toLowerCase()
    const existingTrigrams = extractTrigrams(existingText)
    const similarity = trigramSimilarity(inputTrigrams, existingTrigrams)
    maxSimilarity = Math.max(maxSimilarity, similarity)
  }

  if (maxSimilarity > 0.8) {
    return { score: 0.5, flag: 'high_similarity_submission' }
  }
  if (maxSimilarity > 0.6) {
    return { score: 0.2, flag: 'moderate_similarity_submission' }
  }

  return { score: 0 }
}

/**
 * Analyze API call patterns for a user.
 * Flags: highly regular timing (bot behavior), single-endpoint hammering.
 */
export async function checkApiPatterns(userId: string): Promise<{
  score: number
  flags: string[]
}> {
  const supabase = createClient()
  const flags: string[] = []

  // Get recent events and check timing regularity
  const { data: events } = await (supabase
    .from('participation_events')
    .select('created_at, event_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(100))

  if (!events || events.length < 5) return { score: 0, flags: [] }

  // Check timing regularity (bots often have very regular intervals)
  const intervals: number[] = []
  for (let i = 1; i < events.length; i++) {
    const diff = new Date(events[i].created_at).getTime() - new Date(events[i - 1].created_at).getTime()
    intervals.push(diff)
  }

  if (intervals.length > 3) {
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / intervals.length
    const coeffOfVariation = Math.sqrt(variance) / (mean || 1)

    // Very low coefficient of variation = suspiciously regular
    if (coeffOfVariation < 0.1 && mean < 60000) {
      flags.push('regular_timing_pattern')
    }
  }

  // Check endpoint diversity
  const eventTypes = new Set(events.map((e: any) => e.event_type))
  if (eventTypes.size === 1 && events.length > 20) {
    flags.push('single_event_type_spam')
  }

  const score = flags.length * 0.15
  return { score: Math.min(score, 0.5), flags }
}

/**
 * Update a wallet's sybil risk score with behavioral analysis results.
 */
export async function updateBehavioralScore(
  walletAddress: string,
  behavioralScore: number,
  behavioralFlags: string[]
): Promise<void> {
  const supabase = createClient()

  const { data: existing } = await (supabase
    .from('anti_sybil_flags')
    .select('risk_score, flags')
    .eq('wallet_address', walletAddress)
    .returns<Row<'anti_sybil_flags'>[]>().maybeSingle())

  const currentFlags = (Array.isArray(existing?.flags) ? existing.flags : []) as string[]
  const mergedFlags = Array.from(new Set([...currentFlags, ...behavioralFlags]))
  const newScore = Math.min((existing?.risk_score || 0) + behavioralScore, 1.0)

  if (existing) {
    await (supabase
      .from('anti_sybil_flags')
      .update({
        risk_score: newScore,
        flags: mergedFlags,
        updated_at: new Date().toISOString(),
      })
      .eq('wallet_address', walletAddress))
  } else {
    await (supabase.from('anti_sybil_flags').insert({
      wallet_address: walletAddress,
      risk_score: newScore,
      flags: mergedFlags,
    }))
  }
}

// ── Helpers ──

function extractTrigrams(text: string): Set<string> {
  const trigrams = new Set<string>()
  const cleaned = text.replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ')
  for (let i = 0; i <= cleaned.length - 3; i++) {
    trigrams.add(cleaned.slice(i, i + 3))
  }
  return trigrams
}

function trigramSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const t of Array.from(a)) {
    if (b.has(t)) intersection++
  }
  return (2 * intersection) / (a.size + b.size)
}
