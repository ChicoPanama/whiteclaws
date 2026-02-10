import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import ProtocolIcon from '@/components/ProtocolIcon'
import { getProtocolBySlug } from '@/lib/data/protocols'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
const hasSupabaseConfig = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const defaultBranding = {
  primary: '#6366F1',
  accent: '#3730A3',
  text_on_primary: '#FFFFFF',
}

async function getProtocol(slug: string) {
  if (!hasSupabaseConfig) {
    return getProtocolBySlug(slug)
  }
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
  const branding = protocol.branding || defaultBranding

  const brandStyles = {
    '--brand': branding.primary,
    '--brand-accent': branding.accent,
    '--brand-text': branding.text_on_primary,
    '--brand-glow': `${branding.primary}15`,
    '--brand-border': `${branding.primary}40`,
    '--brand-surface': `${branding.accent}30`,
  } as CSSProperties

  return (
    <>
      <Nav />
      <div className="protocol-page min-h-screen" style={brandStyles}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="protocol-header mb-8 p-6 rounded-2xl border">
            <div className="flex items-center gap-4 mb-4">
              <div className="protocol-icon-chip">
                <ProtocolIcon name={protocol.name} logo_url={protocol.logo_url} size={56} />
              </div>
              <div>
                <h1 className="text-4xl font-bold">{protocol.name}</h1>
                <p className="text-sm opacity-85">Protocol bounty details</p>
              </div>
            </div>
            <p className="text-lg opacity-90">{protocol.description || 'No protocol description provided.'}</p>
          </div>

          <div className="protocol-bounty-card rounded-xl p-6 mb-8 border">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💰</span>
              <h2 className="text-2xl font-semibold">Bounty Rewards</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg p-4 protocol-bounty-max">
                <p className="text-sm">Maximum</p>
                <p className="text-3xl font-bold">${bounty.max?.toLocaleString()}</p>
              </div>
              <div className="rounded-lg p-4 protocol-bounty-max">
                <p className="text-sm">Minimum</p>
                <p className="text-3xl font-bold">${bounty.min?.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {protocol.chains?.map((chain: string) => (
                <span key={chain} className="protocol-chain-badge px-3 py-1 rounded-full text-sm">
                  {chain}
                </span>
              ))}
              <span className="protocol-category-badge px-3 py-1 rounded-full text-sm">{protocol.category}</span>
              {bounty.kyc_required && <span className="protocol-category-badge px-3 py-1 rounded-full text-sm">KYC</span>}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎚️</span>
              <h2 className="text-2xl font-semibold">Severity Payouts</h2>
            </div>
            {Object.keys(severity).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(severity).map(([level, data]: [string, any]) => (
                  <div key={level} className={`protocol-severity-card ${level} rounded-lg p-4 border`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xl font-semibold capitalize">{level}</span>
                      <span className="text-lg font-bold">${data.max?.toLocaleString?.() || data.max}</span>
                    </div>
                    <p className="text-sm opacity-90">{data.description || 'No severity description provided.'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="protocol-bounty-card rounded-lg p-4 border">No severity payout data available.</div>
            )}
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📜</span>
              <h2 className="text-2xl font-semibold">In Scope Contracts</h2>
              <span className="protocol-category-badge text-sm px-2 py-1 rounded-full">{contracts.length}</span>
            </div>
            {contracts.length > 0 ? (
              <div className="space-y-3">
                {contracts.map((contract: any, i: number) => (
                  <div key={i} className="protocol-contract-row rounded-lg p-4 border flex justify-between items-center gap-4">
                    <div>
                      <p className="font-medium">{contract.name}</p>
                      <p className="text-sm">{contract.address?.slice?.(0, 20)}...</p>
                      <p className="text-xs opacity-75">{contract.network}</p>
                    </div>
                    <span className="protocol-contract-type text-xs px-2 py-1 rounded">{contract.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="protocol-bounty-card rounded-lg p-4 border">No in-scope contracts listed.</div>
            )}
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✅</span>
              <h2 className="text-2xl font-semibold">In Scope</h2>
            </div>
            <ul className="protocol-scope-list rounded-lg p-4 border space-y-2">
              {scope.in_scope?.length > 0 ? (
                scope.in_scope.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span>✓</span> {item}
                  </li>
                ))
              ) : (
                <li>No in-scope items provided.</li>
              )}
            </ul>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">❌</span>
              <h2 className="text-2xl font-semibold">Out of Scope</h2>
            </div>
            <ul className="protocol-scope-list rounded-lg p-4 border space-y-2">
              {scope.out_of_scope?.length > 0 ? (
                scope.out_of_scope.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span>×</span> {item}
                  </li>
                ))
              ) : (
                <li>No out-of-scope items provided.</li>
              )}
            </ul>
          </div>

          <div className="flex flex-wrap gap-4">
            <a href={`/submit?protocol=${protocol.slug}`} className="protocol-submit-btn font-semibold px-8 py-4 rounded-lg text-lg">
              Submit Finding →
            </a>
            <a
              href={`https://immunefi.com/bug-bounty/${protocol.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="protocol-secondary-btn font-semibold px-6 py-4 rounded-lg"
            >
              View on Immunefi ↗
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
