import { createClient } from '@/lib/supabase/server'
import type { Bounty } from '@/lib/data/types'
import { getProtocolsFromJSON } from '@/lib/data/protocols'
import { normalizeCategory, normalizeChain } from '@/lib/data/categoryMap'

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function getJSONBounties(): Bounty[] {
  const protocols = getProtocolsFromJSON()
  return protocols.map((p) => ({
    id: p.slug,
    name: p.name,
    icon: p.name.charAt(0),
    logo_url: p.logo_url || null,
    category: normalizeCategory(p.category),
    tags: ['Immunefi'],
    chains: p.chains?.length ? p.chains.map(normalizeChain) : ['Multi-chain'],
    language: 'Solidity',
    maxReward: `$${(p.bounty?.max ?? 0).toLocaleString()}`,
    maxRewardNum: p.bounty?.max ?? 0,
    reward: `$${(p.bounty?.max ?? 0).toLocaleString()}`,
    liveSince: 'Live',
    type: 'Smart Contract',
  }))
}

export async function getBounties(): Promise<Bounty[]> {
  if (!hasSupabaseConfig) {
    return getJSONBounties()
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('protocols')
    .select('id,slug,name,chains,max_bounty,description,category,logo_url')
    .order('max_bounty', { ascending: false })

  if (error) throw error

  return (data ?? []).map((protocol) => ({
    id: protocol.slug,
    name: protocol.name,
    icon: protocol.name.charAt(0),
    logo_url: protocol.logo_url || null,
    category: normalizeCategory(protocol.category ?? 'Protocol'),
    tags: ['Immunefi'],
    chains: protocol.chains?.length ? protocol.chains.map(normalizeChain) : ['Multi-chain'],
    language: 'Solidity',
    maxReward: `$${(protocol.max_bounty ?? 0).toLocaleString()}`,
    maxRewardNum: protocol.max_bounty ?? 0,
    reward: `$${(protocol.max_bounty ?? 0).toLocaleString()}`,
    liveSince: 'Live',
    type: 'Smart Contract',
  }))
}
