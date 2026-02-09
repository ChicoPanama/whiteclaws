import { createAgentWallet } from '@/lib/web3/wallet'

export interface AgentRecord {
  id: string
  name: string
  status: 'Draft' | 'Active'
  walletAddress?: string | null
  createdAt: string
}

const mockAgents: AgentRecord[] = [
  {
    id: 'agent-1',
    name: 'Scanner v2',
    status: 'Active',
    walletAddress: '0x9a2c...7B4e',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'agent-2',
    name: 'Bridge Monitor',
    status: 'Draft',
    walletAddress: null,
    createdAt: new Date().toISOString(),
  },
]

export async function getAgents(): Promise<AgentRecord[]> {
  try {
    const response = await fetch('/api/agents', { cache: 'no-store' })
    if (!response.ok) {
      return mockAgents
    }
    const data = await response.json()
    return (data.agents ?? []).map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      status: agent.status ?? 'Draft',
      walletAddress: agent.wallet_address ?? agent.walletAddress ?? null,
      createdAt: agent.created_at ?? new Date().toISOString(),
    }))
  } catch (error) {
    return mockAgents
  }
}

export async function createAgent(name: string): Promise<AgentRecord> {
  try {
    const response = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!response.ok) {
      throw new Error('Failed to create agent')
    }
    const data = await response.json()
    const agent = data.agent ?? {}
    return {
      id: agent.id ?? `agent-${Date.now()}`,
      name: agent.name ?? name,
      status: agent.status ?? 'Draft',
      walletAddress: agent.wallet_address ?? null,
      createdAt: agent.created_at ?? new Date().toISOString(),
    }
  } catch (error) {
    return {
      id: `agent-${Date.now()}`,
      name,
      status: 'Draft',
      walletAddress: null,
      createdAt: new Date().toISOString(),
    }
  }
}

export async function createWalletForAgent(agentId: string): Promise<{ address: string }> {
  try {
    const response = await fetch(`/api/agents/${agentId}/wallet`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error('Failed to create wallet')
    }
    return response.json()
  } catch (error) {
    return createAgentWallet()
  }
}
