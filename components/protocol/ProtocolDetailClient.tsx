'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'

const EXPLORERS: Record<string, string> = {
  ethereum: 'https://etherscan.io/address/',
  arbitrum: 'https://arbiscan.io/address/',
  optimism: 'https://optimistic.etherscan.io/address/',
  polygon: 'https://polygonscan.com/address/',
  bsc: 'https://bscscan.com/address/',
  base: 'https://basescan.org/address/',
  avalanche: 'https://snowtrace.io/address/',
  fantom: 'https://ftmscan.com/address/',
  blast: 'https://blastscan.io/address/',
  gnosis: 'https://gnosisscan.io/address/',
  celo: 'https://celoscan.io/address/',
  scroll: 'https://scrollscan.com/address/',
  linea: 'https://lineascan.build/address/',
  near: 'https://nearblocks.io/address/',
  solana: 'https://solscan.io/account/',
}

const CHAIN_SHORT: Record<string, string> = {
  ethereum: 'ETH', arbitrum: 'ARB', optimism: 'OP', polygon: 'MATIC',
  bsc: 'BSC', base: 'Base', avalanche: 'AVAX', fantom: 'FTM',
  blast: 'BLAST', gnosis: 'GNO', celo: 'CELO', harmony: 'ONE',
  kava: 'KAVA', aurora: 'AURORA', injective: 'INJ', near: 'NEAR',
  solana: 'SOL', stacks: 'STX', cosmos: 'ATOM', hedera: 'HBAR',
  scroll: 'SCROLL', linea: 'LINEA', zksync: 'zkSync',
}

const SEV: Record<string, { dot: string; bg: string; border: string }> = {
  critical: { dot: '#FF4747', bg: 'rgba(255,71,71,0.06)', border: 'rgba(255,71,71,0.18)' },
  high:     { dot: '#FF8C42', bg: 'rgba(255,140,66,0.06)', border: 'rgba(255,140,66,0.18)' },
  medium:   { dot: '#FFD166', bg: 'rgba(255,209,102,0.06)', border: 'rgba(255,209,102,0.18)' },
  low:      { dot: '#60A5FA', bg: 'rgba(96,165,250,0.06)', border: 'rgba(96,165,250,0.18)' },
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button className="pd-copy" onClick={(e) => {
      e.stopPropagation(); navigator.clipboard.writeText(text)
      setOk(true); setTimeout(() => setOk(false), 1500)
    }}>{ok ? '✓' : '⎘'}</button>
  )
}

interface SevData { min: number; max: number; description: string; reward_calc?: string }
interface ContractData { address: string; network: string; name: string; type: string }
interface ScopeData { in_scope: string[]; out_of_scope: string[]; functions_critical?: string[]; functions_high?: string[] }

interface Props {
  severity: Record<string, SevData>
  contracts: ContractData[]
  scope: ScopeData
  slug: string
  immunefi_url?: string
  program_rules?: string[]
}

export default function ProtocolDetailClient({ severity, contracts, scope, slug, program_rules }: Props) {
  const [expanded, setExpanded] = useState<string | null>('critical')
  const [tab, setTab] = useState<'scope' | 'contracts'>('scope')
  const sevEntries = Object.entries(severity)
  const hasContracts = contracts.length > 0
  const hasCritFns = (scope.functions_critical?.length ?? 0) > 0
  const hasHighFns = (scope.functions_high?.length ?? 0) > 0

  return (
    <>
      {/* SEVERITY TIERS */}
      {sevEntries.length > 0 && (
        <section className="pd-section">
          <h2 className="pd-heading"><span className="pd-num">01</span>Severity Tiers</h2>
          <div className="pd-sev-bar">
            {sevEntries.map(([level]) => {
              const c = SEV[level] || SEV.low
              return <div key={level} className="pd-sev-bar-seg" style={{ background: c.dot }} />
            })}
          </div>
          <div className="pd-sev-stack">
            {sevEntries.map(([level, data]) => {
              const c = SEV[level] || SEV.low
              const isOpen = expanded === level
              const cardStyle: CSSProperties = { background: c.bg, borderColor: c.border }
              return (
                <button key={level} type="button" className={`pd-sev-card ${isOpen ? 'open' : ''}`}
                  style={cardStyle}
                  onClick={() => setExpanded(isOpen ? null : level)}>
                  <div className="pd-sev-top">
                    <div className="pd-sev-label">
                      <span className="pd-sev-dot" style={{ background: c.dot }} />
                      <span className="pd-sev-level" style={{ color: c.dot }}>{level.toUpperCase()}</span>
                    </div>
                    <div className="pd-sev-amount">
                      <span className="pd-sev-max">${data.max?.toLocaleString()}</span>
                      <span className="pd-sev-suffix">max</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="pd-sev-detail" style={{ borderColor: c.border }}>
                      <p className="pd-sev-desc">{data.description}</p>
                      <div className="pd-sev-range">
                        <span>Min: <strong>${data.min?.toLocaleString()}</strong></span>
                        <span>Max: <strong>${data.max?.toLocaleString()}</strong></span>
                      </div>
                      {data.reward_calc && <p className="pd-sev-calc">ⓘ {data.reward_calc}</p>}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* PROGRAM RULES */}
      {program_rules && program_rules.length > 0 && (
        <section className="pd-rules">
          <h3 className="pd-rules-title">⚠ Program Rules</h3>
          <ol className="pd-rules-list">
            {program_rules.map((rule, i) => (
              <li key={i}><span className="pd-rules-num">{String(i+1).padStart(2,'0')}</span>{rule}</li>
            ))}
          </ol>
        </section>
      )}

      {/* TAB NAV */}
      <div className="pd-tabs">
        <button type="button" className={`pd-tab ${tab === 'scope' ? 'active' : ''}`} onClick={() => setTab('scope')}>Scope</button>
        <button type="button" className={`pd-tab ${tab === 'contracts' ? 'active' : ''}`} onClick={() => setTab('contracts')}>
          Contracts{hasContracts ? ` (${contracts.length})` : ''}
        </button>
      </div>

      {/* SCOPE TAB */}
      {tab === 'scope' && (
        <section className="pd-scope-grid">
          <div className="pd-scope-panel pd-scope-in">
            <h3 className="pd-scope-title in">✓ IN SCOPE</h3>
            <ul className="pd-scope-list">
              {scope.in_scope.length > 0 ? scope.in_scope.map((item, i) => (
                <li key={i}><span className="pd-scope-bullet in">●</span>{item}</li>
              )) : <li className="pd-empty">Scope details being verified by WhiteClaws agents.</li>}
            </ul>
            {hasCritFns && (
              <div className="pd-fn-section">
                <span className="pd-fn-label critical">CRITICAL FUNCTIONS</span>
                <div className="pd-fn-tags">
                  {scope.functions_critical!.map(fn => <code key={fn} className="pd-fn-tag critical">{fn}()</code>)}
                </div>
              </div>
            )}
            {hasHighFns && (
              <div className="pd-fn-section">
                <span className="pd-fn-label high">HIGH FUNCTIONS</span>
                <div className="pd-fn-tags">
                  {scope.functions_high!.map(fn => <code key={fn} className="pd-fn-tag high">{fn}()</code>)}
                </div>
              </div>
            )}
          </div>
          <div className="pd-scope-panel pd-scope-out">
            <h3 className="pd-scope-title out">✕ OUT OF SCOPE</h3>
            <ul className="pd-scope-list">
              {scope.out_of_scope.length > 0 ? scope.out_of_scope.map((item, i) => (
                <li key={i}><span className="pd-scope-bullet out">●</span>{item}</li>
              )) : <li className="pd-empty">No exclusions listed.</li>}
            </ul>
          </div>
        </section>
      )}

      {/* CONTRACTS TAB */}
      {tab === 'contracts' && (
        <section className="pd-contracts">
          {hasContracts ? contracts.map((c, i) => {
            const explorer = EXPLORERS[c.network?.toLowerCase()]
            return (
              <div key={i} className="pd-contract">
                <div className="pd-contract-info">
                  <div className="pd-contract-head">
                    <span className="pd-contract-name">{c.name}</span>
                    <span className="pd-contract-type">{c.type}</span>
                  </div>
                  <div className="pd-contract-addr-row">
                    <code className="pd-contract-addr">{c.address}</code>
                    <CopyBtn text={c.address} />
                  </div>
                  <span className="pd-contract-net">{CHAIN_SHORT[c.network?.toLowerCase()] || c.network?.toUpperCase()}</span>
                </div>
                {explorer && (
                  <a href={`${explorer}${c.address}`} target="_blank" rel="noopener noreferrer" className="pd-contract-link">Explorer ↗</a>
                )}
              </div>
            )
          }) : (
            <div className="pd-empty-block">
              <p>Contract scope being mapped by WhiteClaws agents.</p>
              <p className="pd-empty-hint">Verified contract addresses will appear here as agents complete their analysis.</p>
            </div>
          )}
        </section>
      )}

      {/* CTA */}
      <div className="pd-cta">
        <a href={`/submit?protocol=${slug}`} className="pd-btn-primary">Submit Finding →</a>
        <a href="/bounties" className="pd-btn-secondary">← Browse All Programs</a>
      </div>

      <div className="pd-meta">
        <span>Bounty program indexed by WhiteClaws</span>
        <span>Scope and payouts may be updated as agents verify on-chain data.</span>
      </div>
    </>
  )
}
