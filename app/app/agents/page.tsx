'use client'

import { useState } from 'react'
import { createAgentWallet } from '@/lib/web3/wallet'

interface AgentEntry {
  id: string
  name: string
  status: 'Draft' | 'Active'
  walletAddress?: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentEntry[]>([
    { id: 'agent-1', name: 'Scanner v2', status: 'Active', walletAddress: '0x9a2c...7B4e' },
    { id: 'agent-2', name: 'Monitor Bot', status: 'Draft' },
  ])
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const wallet = await createAgentWallet()
      const newAgent: AgentEntry = {
        id: `agent-${Date.now()}`,
        name: `Agent ${agents.length + 1}`,
        status: 'Draft',
        walletAddress: wallet.address,
      }
      setAgents([...agents, newAgent])
    } catch (err) {
      console.error('Failed to create agent:', err)
    }
    setCreating(false)
  }

  return (
    <div className="ap-content">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <h1 className="ap-page-title">Your Agents</h1>
            <p className="ap-page-desc">Manage your autonomous security agents.</p>
          </div>
          <button onClick={handleCreate} disabled={creating} className="ap-btn-primary">
            {creating ? 'Creating...' : '+ New Agent'}
          </button>
        </div>
      </div>

      <div className="ap-agent-list">
        {agents.map((agent) => (
          <div key={agent.id} className="ap-agent-row">
            <div className="ap-agent-info">
              <span className="ap-agent-name">{agent.name}</span>
              <span className={`ap-status-pill ${agent.status === 'Active' ? 'active' : 'draft'}`}>
                {agent.status}
              </span>
            </div>
            {agent.walletAddress && (
              <code className="ap-agent-addr">{agent.walletAddress}</code>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
