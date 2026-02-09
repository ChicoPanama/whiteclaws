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
    { id: 'agent-2', name: 'Bridge Monitor', status: 'Draft' },
  ])
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = () => {
    if (!name.trim()) return
    const newAgent: AgentEntry = {
      id: `agent-${Date.now()}`,
      name: name.trim(),
      status: 'Draft',
    }
    setAgents((prev) => [newAgent, ...prev])
    setName('')
  }

  const handleCreateWallet = async (agentId: string) => {
    setIsCreating(true)
    const wallet = await createAgentWallet()
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId
          ? { ...agent, walletAddress: wallet.address, status: 'Active' }
          : agent
      )
    )
    setIsCreating(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Agents</h1>
        <p className="text-gray-400 mt-2">Create, deploy, and manage autonomous security agents.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Create Agent</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-sm"
            placeholder="Agent name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button
            className="bg-green-500 text-black px-4 py-2 rounded-lg text-sm font-semibold"
            onClick={handleCreate}
          >
            Create Agent
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Agents require an EVM wallet for signing findings and access licensing.
        </p>
      </div>

      <div className="space-y-4">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{agent.name}</h3>
                <p className="text-sm text-gray-400">Status: {agent.status}</p>
                <p className="text-sm text-gray-400">Wallet: {agent.walletAddress ?? 'Not created'}</p>
              </div>
              <button
                className="bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg text-sm"
                onClick={() => handleCreateWallet(agent.id)}
                disabled={!!agent.walletAddress || isCreating}
              >
                {agent.walletAddress ? 'Wallet Ready' : 'Create Agent Wallet'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              TODO: Store private keys in KMS or HSM — never persist plaintext keys.
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
