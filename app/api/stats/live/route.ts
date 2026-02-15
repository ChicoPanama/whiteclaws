import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/stats/live
 * Aggregated platform stats from real data. Public, cached 60s.
 * Used by landing page Hero ticker.
 */
export async function GET() {
  try {
    const supabase = createClient()

    // Run all counts in parallel
    const [
      { count: protocolCount },
      { count: agentCount },
      { count: programCount },
      { count: findingCount },
      { count: acceptedCount },
      { count: paidCount },
      { data: earningsData },
      { data: latestFinding },
      { data: latestAgent },
      { data: chainData },
    ] = await Promise.all([
      supabase.from('protocols').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_agent', true),
      supabase.from('programs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('findings').select('id', { count: 'exact', head: true }),
      supabase.from('findings').select('id', { count: 'exact', head: true }).in('status', ['accepted', 'paid']),
      supabase.from('findings').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
      supabase.from('agent_rankings').select('total_bounty_amount').order('total_bounty_amount', { ascending: false }).limit(100),
      supabase.from('findings').select('severity, created_at, protocol:protocol_id(name)').order('created_at', { ascending: false }).limit(1),
      supabase.from('users').select('display_name, created_at').eq('is_agent', true).order('created_at', { ascending: false }).limit(1),
      supabase.from('protocols').select('chains'),
    ])

    // Calculate total earned across all agents
    const totalEarned = (earningsData || []).reduce(
      (sum, r) => sum + (Number(r.total_bounty_amount) || 0), 0
    )

    // Count unique chains
    const chainSet = new Set<string>()
    for (const p of chainData || []) {
      if (Array.isArray(p.chains)) {
        for (const c of p.chains) chainSet.add(c)
      }
    }

    // Format latest finding
    const latest = latestFinding?.[0]
    const latestProto = latest?.protocol as { name?: string } | null
    const latestFindingInfo = latest ? {
      severity: latest.severity,
      protocol: latestProto?.name || 'Unknown',
      ago: getTimeAgo(latest.created_at),
    } : null

    // Format latest agent
    const newestAgent = latestAgent?.[0]
    const latestAgentInfo = newestAgent ? {
      name: newestAgent.display_name,
      ago: getTimeAgo(newestAgent.created_at),
    } : null

    return NextResponse.json({
      protocols: protocolCount || 0,
      agents: agentCount || 0,
      programs: programCount || 0,
      findings: findingCount || 0,
      accepted: acceptedCount || 0,
      paid: paidCount || 0,
      totalEarned,
      chains: chainSet.size,
      latestFinding: latestFindingInfo,
      latestAgent: latestAgentInfo,
      timestamp: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    console.error('Stats live error:', error)
    return NextResponse.json({ protocols: 0, agents: 0, programs: 0, findings: 0, accepted: 0, paid: 0, totalEarned: 0, chains: 0, latestFinding: null, latestAgent: null, timestamp: new Date().toISOString() })
  }
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
