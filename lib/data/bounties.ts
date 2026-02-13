import { createClient } from '@/lib/supabase/server'
import type { Bounty } from '@/lib/data/types'
import { getProtocolsFromJSON } from '@/lib/data/protocols'
import { normalizeCategory, normalizeChain } from '@/lib/data/categoryMap'

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function categoryTags(category: string): string[] {
  const cat = (category || '').toLowerCase()
  if (cat.includes('lending')) return ['Lending', 'Smart Contract']
  if (cat.includes('dex') || cat.includes('trading')) return ['DEX', 'Smart Contract']
  if (cat.includes('bridge')) return ['Bridge', 'Cross-Chain']
  if (cat.includes('staking')) return ['Staking', 'Smart Contract']
  if (cat.includes('yield')) return ['Yield', 'Smart Contract']
  if (cat.includes('stablecoin')) return ['Stablecoin', 'Smart Contract']
  if (cat.includes('l2') || cat.includes('l1') || cat.includes('layer')) return ['L1/L2', 'Infrastructure']
  if (cat.includes('infrastructure') || cat.includes('oracle')) return ['Infrastructure']
  if (cat.includes('gaming') || cat.includes('nft')) return ['Gaming/NFT']
  if (cat.includes('privacy')) return ['Privacy', 'Smart Contract']
  if (cat.includes('rwa')) return ['RWA', 'Smart Contract']
  return ['Smart Contract']
}

export function getJSONBounties(): Bounty[] {
  const protocols = getProtocolsFromJSON()
  return protocols.map((p) => ({
    id: p.slug,
    name: p.name,
    icon: p.name.charAt(0),
    logo_url: p.logo_url || null,
    category: normalizeCategory(p.category),
    tags: categoryTags(p.category),
    chains: p.chains?.length ? p.chains.map(normalizeChain) : ['Multi-chain'],
    language: 'Solidity',
    maxReward: `$${(p.bounty?.max ?? 0).toLocaleString()}`,
    maxRewardNum: p.bounty?.max ?? 0,
    reward: `$${(p.bounty?.max ?? 0).toLocaleString()}`,
    liveSince: p.live_since
      ? new Date(p.live_since).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      : 'Live',
    type: 'Smart Contract',
    // Rich fields
    description: p.description || '',
    kycRequired: p.bounty?.kyc_required ?? false,
    pocRequired: p.poc_required ?? false,
    triaged: p.triaged ?? false,
    payoutToken: p.bounty?.payout_token || 'USDC',
    severityMax: p.severity_payouts?.critical?.max ?? 0,
    severityHigh: p.severity_payouts?.high?.max ?? 0,
    scopeCount: p.scope?.in_scope?.length ?? 0,
    contractCount: p.contracts?.length ?? 0,
  }))
}

export async function getBounties(): Promise<Bounty[]> {
  if (!hasSupabaseConfig) {
    return getJSONBounties()
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('protocols')
    .select('id,slug,name,chains,max_bounty,description,category,logo_url,website_url,twitter,discord,telegram,github_url,docs_url,security_email,contact_email,bounty_policy_url,auditors,audit_report_urls,whitepaper_url,coingecko_id,market_cap_rank')
    .order('max_bounty', { ascending: false })

  if (error) throw error

  return (data ?? []).map((protocol) => ({
    id: protocol.slug,
    name: protocol.name,
    icon: protocol.name.charAt(0),
    logo_url: protocol.logo_url || null,
    category: normalizeCategory(protocol.category ?? 'Protocol'),
    tags: categoryTags(protocol.category ?? ''),
    chains: protocol.chains?.length ? protocol.chains.map(normalizeChain) : ['Multi-chain'],
    language: 'Solidity',
    maxReward: `$${(protocol.max_bounty ?? 0).toLocaleString()}`,
    maxRewardNum: protocol.max_bounty ?? 0,
    reward: `$${(protocol.max_bounty ?? 0).toLocaleString()}`,
    liveSince: 'Live',
    type: 'Smart Contract',
    description: protocol.description || '',
    // Enrichment
    website_url: protocol.website_url || null,
    twitter: protocol.twitter || null,
    discord: protocol.discord || null,
    telegram: protocol.telegram || null,
    github_url: protocol.github_url || null,
    docs_url: protocol.docs_url || null,
    security_email: protocol.security_email || null,
    contact_email: protocol.contact_email || null,
    bounty_policy_url: protocol.bounty_policy_url || null,
    auditors: protocol.auditors as string[] | null,
    audit_report_urls: protocol.audit_report_urls as string[] | null,
    whitepaper_url: protocol.whitepaper_url || null,
    coingecko_id: protocol.coingecko_id || null,
    market_cap_rank: protocol.market_cap_rank || null,
  }))
}
