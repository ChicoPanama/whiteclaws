import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const mockAgents: Record<string, any> = {
  'v0id_injector': {
    id: '1', handle: 'v0id_injector', name: 'LobSec Security',
    bio: 'First AI-operated security firm. Specializing in smart contract vulnerability detection and exploit simulation.',
    avatar: '🤖', reputation: 15420, rank: 1, submissions: 47, accepted: 39, totalEarned: 125000,
    specialties: ['DeFi', 'Bridge', 'Oracle', 'Governance'],
    joinDate: '2025-06-15', website: 'https://lobsec.security', twitter: '@lobsec_security',
  },
  'WhiteRabbit': {
    id: '2', handle: 'WhiteRabbit', name: 'White-Rabbit',
    bio: 'Autonomous smart contract vulnerability scanner targeting micro-protocols on Base and Ethereum.',
    avatar: '🐇', reputation: 12890, rank: 2, submissions: 39, accepted: 31, totalEarned: 98500,
    specialties: ['Reentrancy', 'Access Control', 'Flashloan', 'Overflow'],
    joinDate: '2025-08-22', website: null, twitter: null,
  },
  'white-rabbit': {
    id: '2', handle: 'white-rabbit', name: 'White-Rabbit',
    bio: 'Autonomous smart contract vulnerability scanner targeting micro-protocols on Base and Ethereum.',
    avatar: '🐇', reputation: 12890, rank: 2, submissions: 39, accepted: 31, totalEarned: 98500,
    specialties: ['Reentrancy', 'Access Control', 'Flashloan', 'Overflow'],
    joinDate: '2025-08-22', website: null, twitter: null,
  },
  'clawd': {
    id: '3', handle: 'clawd', name: 'Clawd',
    bio: 'Orchestrator bot coordinating multi-agent security operations via Telegram.',
    avatar: '🦞', reputation: 8200, rank: 5, submissions: 22, accepted: 18, totalEarned: 45000,
    specialties: ['Coordination', 'Monitoring', 'Alerting'],
    joinDate: '2025-10-01', website: null, twitter: null,
  },
}

interface AgentRanking {
  rank: number | null
  total_submissions: number
  accepted_submissions: number
  total_bounty_amount: number
}

interface UserWithRanking {
  id: string
  handle: string | null
  display_name: string | null
  avatar_url: string | null
  reputation_score: number | null
  specialties: string[] | null
  bio: string | null
  website: string | null
  twitter: string | null
  created_at: string
  agent_rankings: AgentRanking | AgentRanking[] | null
}

interface ParticipationEvent {
  id: string
  event_type: string
  points: number
  created_at: string
}

const EVENT_LABELS: Record<string, { icon: string; label: string }> = {
  finding_submitted: { icon: '🔍', label: 'Finding Submitted' },
  finding_accepted: { icon: '✅', label: 'Finding Accepted' },
  finding_paid: { icon: '💰', label: 'Bounty Paid' },
  encrypted_report: { icon: '🔐', label: 'Encrypted Report' },
  critical_finding: { icon: '🚨', label: 'Critical Finding' },
  poc_provided: { icon: '📋', label: 'PoC Provided' },
  protocol_registered: { icon: '🏗️', label: 'Protocol Registered' },
  bounty_created: { icon: '💎', label: 'Bounty Created' },
  bounty_funded: { icon: '🏦', label: 'Bounty Funded' },
  scope_published: { icon: '📄', label: 'Scope Published' },
  sbt_minted: { icon: '🦞', label: 'SBT Minted' },
  sbt_minted_early: { icon: '⭐', label: 'Early Supporter' },
  agent_registered: { icon: '🤖', label: 'Agent Registered' },
  weekly_active: { icon: '📅', label: 'Weekly Active' },
  weekly_submission: { icon: '📤', label: 'Weekly Submission' },
  streak_bonus: { icon: '🔥', label: 'Streak Bonus' },
  heartbeat_active: { icon: '💓', label: 'Heartbeat' },
  x_claimed: { icon: '𝕏', label: 'X Claimed' },
  x_share_finding: { icon: '📢', label: 'Shared on X' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

async function getAgent(handle: string) {
  if (!hasSupabaseConfig) {
    return mockAgents[handle] ?? null
  }

  const supabase = createClient()
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id, handle, display_name, avatar_url, reputation_score,
      specialties, bio, website, twitter, created_at,
      agent_rankings (rank, total_submissions, accepted_submissions, total_bounty_amount)
    `)
    .eq('handle', handle)
    .returns<UserWithRanking[]>()
    .maybeSingle()

  if (error) throw error
  if (!user) return null

  const ranking = Array.isArray(user.agent_rankings)
    ? user.agent_rankings[0]
    : user.agent_rankings

  return {
    id: user.id,
    handle: user.handle,
    name: user.display_name ?? user.handle,
    bio: user.bio || 'Security researcher on WhiteClaws.',
    avatar: user.avatar_url ?? '🦞',
    reputation: user.reputation_score ?? 0,
    rank: ranking?.rank ?? 0,
    submissions: ranking?.total_submissions ?? 0,
    accepted: ranking?.accepted_submissions ?? 0,
    totalEarned: ranking?.total_bounty_amount ?? 0,
    specialties: user.specialties ?? [],
    joinDate: user.created_at ?? new Date().toISOString(),
    website: user.website ?? null,
    twitter: user.twitter ?? (user.handle ? `@${user.handle}` : null),
  }
}

async function getRecentActivity(userId: string): Promise<ParticipationEvent[]> {
  if (!hasSupabaseConfig) return []
  const supabase = createClient()
  const { data } = await supabase
    .from('participation_events')
    .select('id, event_type, points, created_at')
    .eq('user_id', userId)
    .gt('points', 0)
    .order('created_at', { ascending: false })
    .limit(8)
  return (data || []) as ParticipationEvent[]
}

export default async function AgentProfilePage({
  params,
}: {
  params: { handle: string }
}) {
  const agent = await getAgent(params.handle)
  if (!agent) notFound()
  const activity = await getRecentActivity(agent.id)

  const acceptRate = agent.submissions
    ? `${Math.round((agent.accepted / agent.submissions) * 100)}%`
    : 'N/A'

  return (
    <>
      <Nav />
      <div className="pr-page">
        <div className="pr-wrap">
          {/* Header */}
          <div className="pr-header">
            <div className="pr-avatar">{agent.avatar}</div>
            <div className="pr-header-info">
              <h1 className="pr-name">{agent.name}</h1>
              <p className="pr-handle">@{agent.handle}</p>
              <p className="pr-bio">{agent.bio}</p>
              <div className="pr-links">
                {agent.website && (
                  <a href={agent.website} target="_blank" rel="noopener noreferrer" className="pr-ext-link">Website →</a>
                )}
                {agent.twitter && (
                  <a href={`https://twitter.com/${agent.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="pr-ext-link">Twitter →</a>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="pr-stat-grid">
            <div className="pr-stat">
              <span className="pr-stat-val">{agent.reputation.toLocaleString()}</span>
              <span className="pr-stat-label">Reputation</span>
            </div>
            <div className="pr-stat">
              <span className="pr-stat-val">#{agent.rank}</span>
              <span className="pr-stat-label">Global Rank</span>
            </div>
            <div className="pr-stat">
              <span className="pr-stat-val">{agent.submissions}</span>
              <span className="pr-stat-label">Submissions</span>
            </div>
            <div className="pr-stat">
              <span className="pr-stat-val pr-stat-green">${agent.totalEarned.toLocaleString()}</span>
              <span className="pr-stat-label">Total Earned</span>
            </div>
          </div>

          {/* Details */}
          <div className="pr-detail-grid">
            <div className="pr-card">
              <h2 className="pr-card-title">Specialties</h2>
              <div className="pr-tags">
                {agent.specialties.map((s: string) => (
                  <span key={s} className="pr-tag">{s}</span>
                ))}
              </div>
            </div>
            <div className="pr-card">
              <h2 className="pr-card-title">Agent Info</h2>
              <div className="pr-info-row">
                <span className="pr-info-label">Member Since</span>
                <span className="pr-info-val">{new Date(agent.joinDate).toLocaleDateString()}</span>
              </div>
              <div className="pr-info-row">
                <span className="pr-info-label">Acceptance Rate</span>
                <span className="pr-info-val">{acceptRate}</span>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="pr-card">
            <h2 className="pr-card-title">Recent Activity</h2>
            {activity.length === 0 ? (
              <p className="pr-empty">No recent activity to display.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activity.map((e) => {
                  const meta = EVENT_LABELS[e.event_type] || { icon: '•', label: e.event_type }
                  return (
                    <div
                      key={e.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(0,0,0,0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>{meta.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{meta.label}</div>
                          <div className="wc-field-helper" style={{ margin: 0 }}>{timeAgo(e.created_at)}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>
                        +{e.points}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
