/**
 * Quality Gates - Submission Verification
 * Prevents SSV-style false positives and spam submissions
 */

import { createClient } from '@/lib/supabase/admin'

export interface QualityCheckResult {
  passed: boolean
  score: number
  checks: {
    name: string
    passed: boolean
    weight: number
    message?: string
  }[]
  recommendation: 'accept' | 'review' | 'reject'
}

export interface SubmissionQualityContext {
  researcher_id: string
  wallet_address: string
  protocol_slug: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  has_poc: boolean
  encrypted: boolean
}

/**
 * Run all quality checks on a submission
 * Returns overall quality score and pass/fail
 */
export async function checkSubmissionQuality(
  context: SubmissionQualityContext
): Promise<QualityCheckResult> {
  const checks: QualityCheckResult['checks'] = []
  
  // Check 1: Researcher history (30% weight)
  const historyCheck = await checkResearcherHistory(context.researcher_id)
  checks.push({
    name: 'researcher_history',
    passed: historyCheck.passed,
    weight: 0.3,
    message: historyCheck.message,
  })
  
  // Check 2: Submission content quality (25% weight)
  const contentCheck = await checkContentQuality(context)
  checks.push({
    name: 'content_quality',
    passed: contentCheck.passed,
    weight: 0.25,
    message: contentCheck.message,
  })
  
  // Check 3: Not duplicate/audit finding (20% weight)
  const duplicateCheck = await checkDuplicateOrAudit(context)
  checks.push({
    name: 'not_duplicate',
    passed: duplicateCheck.passed,
    weight: 0.2,
    message: duplicateCheck.message,
  })
  
  // Check 4: Protocol cooldown (15% weight)
  const cooldownCheck = await checkProtocolCooldown(context)
  checks.push({
    name: 'protocol_cooldown',
    passed: cooldownCheck.passed,
    weight: 0.15,
    message: cooldownCheck.message,
  })
  
  // Check 5: Has PoC for critical/high (10% weight)
  const pocCheck = checkPoCRequirement(context)
  checks.push({
    name: 'poc_requirement',
    passed: pocCheck.passed,
    weight: 0.1,
    message: pocCheck.message,
  })
  
  // Calculate weighted score
  let totalScore = 0
  let totalWeight = 0
  
  for (const check of checks) {
    if (check.passed) {
      totalScore += check.weight
    }
    totalWeight += check.weight
  }
  
  const score = totalScore / totalWeight
  
  // Determine recommendation
  let recommendation: QualityCheckResult['recommendation']
  if (score >= 0.8) {
    recommendation = 'accept'
  } else if (score >= 0.5) {
    recommendation = 'review'
  } else {
    recommendation = 'reject'
  }
  
  return {
    passed: score >= 0.5,  // Must score 50%+ to pass
    score,
    checks,
    recommendation,
  }
}

/**
 * Check researcher's historical quality
 */
async function checkResearcherHistory(
  researcher_id: string
): Promise<{ passed: boolean; message?: string }> {
  const supabase = createClient()
  
  // Get researcher stats
  const { data: stats } = await supabase
    .from('agent_rankings')
    .select('total_submissions, accepted_submissions')
    .eq('agent_id', researcher_id)
    .single()
  
  if (!stats || stats.total_submissions === 0) {
    // New researcher - give benefit of doubt but flag for review
    return {
      passed: true,
      message: 'New researcher - first submission',
    }
  }
  
  const acceptanceRate = stats.accepted_submissions / stats.total_submissions
  
  // If researcher has >5 submissions with <20% acceptance = poor quality
  if (stats.total_submissions >= 5 && acceptanceRate < 0.2) {
    return {
      passed: false,
      message: `Low historical acceptance rate: ${(acceptanceRate * 100).toFixed(0)}%`,
    }
  }
  
  // If researcher has >10 submissions with >50% acceptance = trusted
  if (stats.total_submissions >= 10 && acceptanceRate > 0.5) {
    return {
      passed: true,
      message: `Trusted researcher: ${(acceptanceRate * 100).toFixed(0)}% acceptance rate`,
    }
  }
  
  return { passed: true }
}

/**
 * Check content quality (length, detail, not spam)
 */
async function checkContentQuality(
  context: SubmissionQualityContext
): Promise<{ passed: boolean; message?: string }> {
  const { title, description } = context
  
  // Title checks
  if (title.length < 10) {
    return { passed: false, message: 'Title too short (min 10 chars)' }
  }
  
  if (title.length > 200) {
    return { passed: false, message: 'Title too long (max 200 chars)' }
  }
  
  // Description checks
  if (description.length < 50) {
    return { passed: false, message: 'Description too short (min 50 chars)' }
  }
  
  // Check for common spam patterns
  const spamPatterns = [
    /test test test/i,
    /asdf/i,
    /lorem ipsum/i,
    /click here/i,
    /buy now/i,
  ]
  
  for (const pattern of spamPatterns) {
    if (pattern.test(title) || pattern.test(description)) {
      return { passed: false, message: 'Spam pattern detected' }
    }
  }
  
  // Check for copy-paste from common sources
  const suspiciousPhrases = [
    'unchecked arithmetic',
    'integer overflow',
    'reentrancy vulnerability',
  ]
  
  let suspiciousCount = 0
  for (const phrase of suspiciousPhrases) {
    if (description.toLowerCase().includes(phrase)) {
      suspiciousCount++
    }
  }
  
  // If contains multiple generic vulnerability phrases without context
  if (suspiciousCount >= 2 && description.length < 200) {
    return {
      passed: false,
      message: 'Generic vulnerability description - needs specific details',
    }
  }
  
  return { passed: true }
}

/**
 * Check if finding is duplicate or already in audit reports
 */
async function checkDuplicateOrAudit(
  context: SubmissionQualityContext
): Promise<{ passed: boolean; message?: string }> {
  const supabase = createClient()
  
  // Get protocol ID
  const { data: protocol } = await supabase
    .from('protocols')
    .select('id')
    .eq('slug', context.protocol_slug)
    .single()
  
  if (!protocol) {
    return { passed: true }  // Protocol not found, can't check
  }
  
  // Check for similar findings (same protocol, similar title)
  const { data: similarFindings } = await supabase
    .from('findings')
    .select('id, title, status')
    .eq('protocol_id', protocol.id)
    .in('status', ['triaged', 'accepted', 'paid'])
    .limit(50)
  
  if (similarFindings && similarFindings.length > 0) {
    const normalizedTitle = context.title.toLowerCase().trim()
    
    for (const finding of similarFindings) {
      const existingTitle = finding.title.toLowerCase().trim()
      
      // Simple similarity check (Levenshtein would be better)
      if (
        normalizedTitle === existingTitle ||
        normalizedTitle.includes(existingTitle) ||
        existingTitle.includes(normalizedTitle)
      ) {
        return {
          passed: false,
          message: `Similar finding already exists: "${finding.title}"`,
        }
      }
    }
  }
  
  // TODO: Check against audit database when integrated
  // This would prevent submitting known audit findings
  
  return { passed: true }
}

/**
 * Check protocol-specific cooldown
 */
async function checkProtocolCooldown(
  context: SubmissionQualityContext
): Promise<{ passed: boolean; message?: string }> {
  const supabase = createClient()
  
  // Get protocol ID
  const { data: protocol } = await supabase
    .from('protocols')
    .select('id')
    .eq('slug', context.protocol_slug)
    .single()
  
  if (!protocol) {
    return { passed: true }
  }
  
  // Check last submission to this protocol
  const cooldownHours = 24
  const cooldownDate = new Date(Date.now() - cooldownHours * 3600000).toISOString()
  
  const { data: recentSubmission } = await supabase
    .from('findings')
    .select('created_at')
    .eq('researcher_id', context.researcher_id)
    .eq('protocol_id', protocol.id)
    .gte('created_at', cooldownDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (recentSubmission) {
    const lastSubmission = new Date(recentSubmission.created_at)
    const hoursAgo = Math.floor((Date.now() - lastSubmission.getTime()) / 3600000)
    
    return {
      passed: false,
      message: `Protocol cooldown: submitted ${hoursAgo}h ago (24h cooldown)`,
    }
  }
  
  return { passed: true }
}

/**
 * Check PoC requirement for critical/high severity
 */
function checkPoCRequirement(
  context: SubmissionQualityContext
): { passed: boolean; message?: string } {
  // Critical and High severity MUST have PoC
  if ((context.severity === 'critical' || context.severity === 'high') && !context.has_poc) {
    return {
      passed: false,
      message: `${context.severity} severity requires proof-of-concept`,
    }
  }
  
  return { passed: true }
}

/**
 * Trust scoring - determines how much verification a researcher needs
 */
export async function getResearcherTrustLevel(
  researcher_id: string
): Promise<{
  level: 'new' | 'developing' | 'trusted' | 'expert'
  acceptance_rate: number
  total_accepted: number
  verification_required: 'full' | 'standard' | 'fast-track'
}> {
  const supabase = createClient()
  
  const { data: stats } = await supabase
    .from('agent_rankings')
    .select('total_submissions, accepted_submissions')
    .eq('agent_id', researcher_id)
    .single()
  
  if (!stats || stats.total_submissions === 0) {
    return {
      level: 'new',
      acceptance_rate: 0,
      total_accepted: 0,
      verification_required: 'full',
    }
  }
  
  const acceptanceRate = stats.accepted_submissions / stats.total_submissions
  
  // Expert: 10+ accepted, 70%+ acceptance rate
  if (stats.accepted_submissions >= 10 && acceptanceRate >= 0.7) {
    return {
      level: 'expert',
      acceptance_rate: acceptanceRate,
      total_accepted: stats.accepted_submissions,
      verification_required: 'fast-track',
    }
  }
  
  // Trusted: 3+ accepted, 50%+ acceptance rate
  if (stats.accepted_submissions >= 3 && acceptanceRate >= 0.5) {
    return {
      level: 'trusted',
      acceptance_rate: acceptanceRate,
      total_accepted: stats.accepted_submissions,
      verification_required: 'standard',
    }
  }
  
  // Developing: Some submissions, building track record
  if (stats.total_submissions >= 3) {
    return {
      level: 'developing',
      acceptance_rate: acceptanceRate,
      total_accepted: stats.accepted_submissions,
      verification_required: 'full',
    }
  }
  
  // New: < 3 submissions
  return {
    level: 'new',
    acceptance_rate: acceptanceRate,
    total_accepted: stats.accepted_submissions,
    verification_required: 'full',
  }
}

/**
 * Calculate overall user quality score
 * Used for Sybil multiplier adjustments
 */
export async function calculateUserQualityScore(
  user_id: string
): Promise<number> {
  const supabase = createClient()
  
  // Get stats
  const { data: stats } = await supabase
    .from('agent_rankings')
    .select('total_submissions, accepted_submissions, total_bounty_amount')
    .eq('agent_id', user_id)
    .single()
  
  if (!stats || stats.total_submissions === 0) {
    return 0.5  // Neutral for new users
  }
  
  const acceptanceRate = stats.accepted_submissions / stats.total_submissions
  const hasEarnings = (stats.total_bounty_amount || 0) > 0
  
  // Quality factors:
  // - Acceptance rate (50% weight)
  // - Has earnings (25% weight)
  // - Volume of accepted findings (25% weight)
  
  let score = 0
  
  // Acceptance rate component
  score += acceptanceRate * 0.5
  
  // Earnings component
  if (hasEarnings) {
    score += 0.25
  }
  
  // Volume component (logarithmic scale)
  const volumeScore = Math.min(stats.accepted_submissions / 10, 1.0)
  score += volumeScore * 0.25
  
  return Math.min(score, 1.0)
}
