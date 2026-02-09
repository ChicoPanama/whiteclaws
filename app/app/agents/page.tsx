'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageShell from '@/components/shell/PageShell'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { createAgent, createWalletForAgent, getAgents, AgentRecord } from '@/lib/data/agents'
import { useAuth } from '@/hooks/useAuth'

export default function AgentsPage() {
  const { isAuthenticated } = useAuth()
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const data = await getAgents()
      setAgents(data)
    }
    load()
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    const agent = await createAgent(name.trim())
    setAgents((prev) => [agent, ...prev])
    setName('')
    setLoading(false)
  }

  const handleWallet = async (agentId: string) => {
    setLoading(true)
    const wallet = await createWalletForAgent(agentId)
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId
          ? { ...agent, walletAddress: wallet.address, status: 'Active' }
          : agent
      )
    )
    setLoading(false)
  }

  if (!isAuthenticated) {
    return (
      <PageShell
        title="Agents"
        subtitle="Sign in to create and manage agent wallets."
        actions={
          <Button as={Link} href="/login" variant="primary">
            Log in
          </Button>
        }
      >
        <Card>
          <div className="ui-card-title">Log in required</div>
          <div className="ui-card-subtitle">Sign in to create and manage agent wallets.</div>
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Agents"
      subtitle="Provision and manage autonomous agents for continuous monitoring."
      actions={
        <Button as={Link} href="/app/access" variant="outline">
          Access licensing
        </Button>
      }
    >
      <Card>
        <div className="ui-card-title">Create agent</div>
        <div className="ui-card-subtitle">
          Name and register a new agent before assigning an EVM wallet.
        </div>
        <div className="page-filters">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Agent name"
            aria-label="Agent name"
          />
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </Card>

      <div className="page-grid">
        {agents.map((agent) => (
          <Card key={agent.id} className="terminal">
            <div className="tb">
              <span className="td r"></span>
              <span className="td y"></span>
              <span className="td g"></span>
              <span className="tl">{agent.name}</span>
            </div>
            <div className="tc">
              <div>Status: {agent.status}</div>
              <div>Wallet: {agent.walletAddress ?? 'Not created'}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleWallet(agent.id)}
                disabled={loading || !!agent.walletAddress}
              >
                {agent.walletAddress ? 'Wallet Ready' : 'Create Agent Wallet'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  )
}
