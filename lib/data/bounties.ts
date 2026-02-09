import { createClient } from '@/lib/supabase/server'
import type { Bounty } from '@/lib/data/types'
import { hasSupabaseEnv } from '@/lib/env'

const mockBounties: Bounty[] = [
  {
    id: 'ssv-network',
    name: 'SSV Network',
    category: 'Infrastructure',
    icon: 'S',
    tags: ['DVT'],
    chains: ['Ethereum'],
    language: 'Solidity',
    maxReward: '$1,000,000',
    maxRewardNum: 1000000,
    liveSince: 'Sep 2025',
    type: 'Smart Contract',
  },
  {
    id: 'uniswap',
    name: 'Uniswap',
    category: 'DeFi',
    icon: 'U',
    tags: ['DEX'],
    chains: ['Ethereum'],
    language: 'Solidity',
    maxReward: '$2,500,000',
    maxRewardNum: 2500000,
    liveSince: 'Jan 2025',
    type: 'Smart Contract',
  },
]

export async function getBounties(): Promise<Bounty[]> {
  if (!hasSupabaseEnv) {
    return mockBounties
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('protocols')
      .select('id,slug,name,chains,max_bounty,description')
      .order('max_bounty', { ascending: false })

    if (error) {
      throw error
    }

    return (data ?? []).map((protocol) => ({
      id: protocol.slug,
      name: protocol.name,
      icon: protocol.name.charAt(0),
      category: 'Protocol',
      tags: ['Immunefi'],
      chains: protocol.chains?.length ? protocol.chains : ['Multi-chain'],
      language: 'Solidity',
      maxReward: `$${(protocol.max_bounty ?? 0).toLocaleString()}`,
      maxRewardNum: protocol.max_bounty ?? 0,
      liveSince: 'Live',
      type: 'Smart Contract',
    }))
  } catch (error) {
    return mockBounties
  }
}
