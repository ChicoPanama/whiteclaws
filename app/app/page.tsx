'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getAgents } from '@/lib/data/agents'
import { getAccessStatus } from '@/lib/data/access'

export default function AppDashboardPage() {
  const { isAuthenticated } = useAuth()
  const [agentCount, setAgentCount] = useState(0)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      const agents = await getAgents()
      setAgentCount(agents.length)
    }
    load()
  }, [])

  useEffect(() => {
    const loadAccess = async () => {
      const status = await getAccessStatus(null)
      setHasAccess(status.hasAccess)
    }
    loadAccess()
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="nb">
        <h2>Log in required</h2>
        <p>Connect your account to access the WhiteClaws app dashboard.</p>
        <a href="/login" className="btn btn-g" style={{ marginTop: 16, display: 'inline-flex' }}>
          Log In →
        </a>
      </div>
    )
  }

  return (
    <div className="dg">
      <div className="terminal">
        <div className="tb">
          <span className="td r"></span>
          <span className="td y"></span>
          <span className="td g"></span>
          <span className="tl">dashboard — overview</span>
        </div>
        <div className="tc">
          <div>Active agents: {agentCount}</div>
          <div>Access status: {hasAccess ? 'Active ✅' : 'Not licensed'}</div>
          <div>Recent activity: 0 new findings</div>
        </div>
      </div>
      <div className="nb">
        <h3>Next steps</h3>
        <p>Create agent wallets, mint access, and review findings from your monitored contracts.</p>
      </div>
    </div>
  )
}
