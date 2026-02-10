import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import ProtocolIcon from '@/components/ProtocolIcon'
import { getProtocolBySlug } from '@/lib/data/protocols'
import { createClient } from '@/lib/supabase/server'
import ProtocolDetailClient from '@/components/protocol/ProtocolDetailClient'

export const dynamic = 'force-dynamic'
const hasSupabaseConfig = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const defaultBranding = { primary: '#6366F1', accent: '#3730A3', text_on_primary: '#FFFFFF' }

const CHAIN_SHORT: Record<string, string> = {
  ethereum: 'ETH', arbitrum: 'ARB', optimism: 'OP', polygon: 'MATIC',
  bsc: 'BSC', base: 'Base', avalanche: 'AVAX', fantom: 'FTM',
  blast: 'BLAST', gnosis: 'GNO', celo: 'CELO', harmony: 'ONE',
  kava: 'KAVA', aurora: 'AURORA', injective: 'INJ', near: 'NEAR',
  solana: 'SOL', stacks: 'STX', cosmos: 'ATOM', hedera: 'HBAR',
  scroll: 'SCROLL', linea: 'LINEA', zksync: 'zkSync',
}

async function getProtocol(slug: string) {
  if (!hasSupabaseConfig) return getProtocolBySlug(slug)
  const supabase = createClient()
  const { data } = await supabase.from('protocols').select('*').eq('slug', slug).single()
  return data
}

export default async function ProtocolPage({ params }: { params: { id: string } }) {
  const protocol = await getProtocol(params.id)
  if (!protocol) notFound()

  const bounty = protocol.bounty || { max: 0, min: 0, kyc_required: false }
  const severity = protocol.severity_payouts || {}
  const contracts = protocol.contracts || []
  const scope = protocol.scope || { in_scope: [], out_of_scope: [] }
  const brand = protocol.branding || defaultBranding

  const chains: string[] = protocol.chains || []
  const maxChainShow = 8
  const visibleChains = chains.slice(0, maxChainShow)
  const extraChains = chains.length - maxChainShow

  const brandStyles = {
    '--brand': brand.primary,
    '--brand-accent': brand.accent,
    '--brand-text': brand.text_on_primary,
    '--brand-glow': `${brand.primary}12`,
    '--brand-border': `${brand.primary}30`,
    '--brand-surface': `${brand.accent}20`,
  } as CSSProperties

  return (
    <>
      <Nav />
      <div className="pd-page" style={brandStyles}>
        <div className="pd-wrap">

          {/* ─── BACK NAV ─── */}
          <a href="/bounties" className="pd-back">← All Bounties</a>

          {/* ─── HERO HEADER ─── */}
          <header className="pd-hero">
            {/* Decorative orb */}
            <div className="pd-hero-orb" />

            <div className="pd-hero-top">
              <div className="pd-hero-icon">
                <ProtocolIcon name={protocol.name} logo_url={protocol.logo_url} size={52} />
              </div>
              <div className="pd-hero-text">
                <div className="pd-hero-name-row">
                  <h1 className="pd-hero-name">{protocol.name}</h1>
                  {protocol.source === 'immunefi' && (
                    <span className="pd-badge-verified">✓ IMMUNEFI</span>
                  )}
                </div>
                <p className="pd-hero-desc">
                  {protocol.description || `${protocol.name} bounty program`}
                </p>
              </div>
            </div>

            {/* Chain & category badges */}
            <div className="pd-hero-badges">
              {visibleChains.map(c => (
                <span key={c} className="pd-badge">{CHAIN_SHORT[c.toLowerCase()] || c.toUpperCase()}</span>
              ))}
              {extraChains > 0 && (
                <span className="pd-badge">+{extraChains} more</span>
              )}
              <span className="pd-badge brand">{protocol.category}</span>
              {bounty.kyc_required && <span className="pd-badge warn">KYC</span>}
              {protocol.poc_required && <span className="pd-badge info">PoC Required</span>}
            </div>
          </header>

          {/* ─── STATS BAR ─── */}
          <div className="pd-stats">
            <div className="pd-stat">
              <span className="pd-stat-label">Max Bounty</span>
              <span className="pd-stat-value accent">
                ${bounty.max?.toLocaleString() || '—'}
              </span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-label">Min Bounty</span>
              <span className="pd-stat-value">
                ${bounty.min?.toLocaleString() || '—'}
              </span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-label">Payout</span>
              <span className="pd-stat-value">
                {bounty.payout_token || 'USDC'}
              </span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-label">Chains</span>
              <span className="pd-stat-value">{chains.length || '—'}</span>
            </div>
          </div>

          {/* ─── INTERACTIVE SECTIONS ─── */}
          <ProtocolDetailClient
            severity={severity}
            contracts={contracts}
            scope={scope}
            slug={protocol.slug}
            immunefi_url={protocol.immunefi_url}
            program_rules={protocol.program_rules}
          />

        </div>
      </div>
      <Footer />
    </>
  )
}
