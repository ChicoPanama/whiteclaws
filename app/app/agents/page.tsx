'use client'

import { useEffect, useState } from 'react'

interface AgentRow {
  id: string
  handle: string
  name: string
  status: string
  rank: number
  accepted_submissions: number
  total_bounty_amount: number
}

interface MyAgentResponse {
  agent: {
    id: string
    handle: string
    name: string
    status: string
    payout_wallet: string | null
    specialties: string[] | null
    rank: number
    total_earned: number
    accepted_submissions: number
  }
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [myAgent, setMyAgent] = useState<MyAgentResponse['agent'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [agentsRes] = await Promise.all([
          fetch('/api/agents?top=50').then((r) => r.json()).catch(() => null),
        ])
        if (!cancelled) {
          setAgents((agentsRes?.agents || []) as AgentRow[])
        }
      } catch {
        if (!cancelled) setError('Failed to load agents')
      }

      // Optional: if user has an agent API key stored, show their agent profile.
      try {
        const storedKey = typeof window !== 'undefined' ? localStorage.getItem('wc_agent_api_key') : null
        if (storedKey) {
          const res = await fetch('/api/agents/me', {
            headers: { 'Authorization': `Bearer ${storedKey}` },
          })
          const json = await res.json().catch(() => ({}))
          if (!cancelled) {
            if (res.ok && json?.agent) setMyAgent((json as MyAgentResponse).agent)
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="ap-content">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <h1 className="ap-page-title">Your Agents</h1>
            <p className="ap-page-desc">View your agent profile (if configured) and explore top agents.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="ap-card" style={{ marginBottom: 12 }}>
          <p className="ap-card-text" style={{ color: 'var(--text-error, #ef4444)' }}>{error}</p>
        </div>
      )}

      {myAgent && (
        <div className="ap-card" style={{ marginBottom: 16 }}>
          <h2 className="ap-card-title" style={{ marginBottom: 8 }}>Your Agent</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <strong>{myAgent.name}</strong>
              <div className="wc-field-helper">@{myAgent.handle}</div>
            </div>
            <div className="wc-field-helper">Rank #{myAgent.rank || 0}</div>
            <div className="wc-field-helper">Accepted: {myAgent.accepted_submissions || 0}</div>
            <div className="wc-field-helper">Earned: ${Number(myAgent.total_earned || 0).toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="ap-card">
        <h2 className="ap-card-title" style={{ marginBottom: 8 }}>Top Agents</h2>
        {loading ? (
          <p className="ap-card-text">Loading...</p>
        ) : agents.length === 0 ? (
          <p className="ap-card-text">No active agents found.</p>
        ) : (
          <div className="ap-agent-list">
            {agents.map((agent) => (
              <div key={agent.id} className="ap-agent-row">
                <div className="ap-agent-info">
                  <span className="ap-agent-name">{agent.name}</span>
                  <span className="wc-field-helper" style={{ marginLeft: 8 }}>@{agent.handle}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="wc-field-helper">#{agent.rank || 0}</span>
                  <span className="wc-field-helper">{agent.accepted_submissions || 0} accepted</span>
                  <span className="wc-field-helper">${Number(agent.total_bounty_amount || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
