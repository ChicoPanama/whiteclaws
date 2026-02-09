'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageShell from '@/components/shell/PageShell'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
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
      <PageShell
        title="App dashboard"
        subtitle="Connect your account to access agents, findings, and access licensing."
        actions={
          <Button as={Link} href="/login" variant="primary">
            Log in
          </Button>
        }
      >
        <Card>
          <div className="ui-card-title">Log in required</div>
          <div className="ui-card-subtitle">
            Connect your account to access the WhiteClaws app dashboard.
          </div>
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="App dashboard"
      subtitle="Monitor agent performance and access state across your security programs."
      actions={
        <Button as={Link} href="/app/agents" variant="outline">
          Manage agents
        </Button>
      }
    >
      <div className="page-grid">
        <Card className="terminal">
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
        </Card>
        <Card>
          <div className="ui-card-title">Next steps</div>
          <div className="ui-card-subtitle">
            Create agent wallets, mint access, and review findings from monitored contracts.
          </div>
        </Card>
      </div>
    </PageShell>
  )
}
