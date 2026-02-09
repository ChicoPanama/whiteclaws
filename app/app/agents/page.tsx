'use client'

import { useEffect, useState } from 'react'
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
      <div className="nb">
        <h2>Log in required</h2>
        <p>Sign in to create and manage agent wallets.</p>
        <a href="/login" className="btn btn-g" style={{ marginTop: 16, display: 'inline-flex' }}>
          Log In →
        </a>
      </div>
    )
  }

  return (
    <div className="dg">
      <div className="nb">
        <h3>Create Agent</h3>
        <p>Name and register a new agent before assigning an EVM wallet.</p>
        <div className="nr">
          <input
            className="ni"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Agent name"
          />
          <button className="nbtn" onClick={handleCreate} disabled={loading}>
            Create
          </button>
        </div>
      </div>

      {agents.map((agent) => (
        <div key={agent.id} className="terminal">
          <div className="tb">
            <span className="td r"></span>
            <span className="td y"></span>
            <span className="td g"></span>
            <span className="tl">{agent.name}</span>
          </div>
          <div className="tc">
            <div>Status: {agent.status}</div>
            <div>Wallet: {agent.walletAddress ?? 'Not created'}</div>
            <button
              className="tcopy"
              type="button"
              onClick={() => handleWallet(agent.id)}
              disabled={loading || !!agent.walletAddress}
            >
              {agent.walletAddress ? 'Wallet Ready' : 'Create Agent Wallet'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
