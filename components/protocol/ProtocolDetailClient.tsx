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
interface SubmissionReqs {
  report_format?: string[]
  severity_criteria?: Record<string, string>
}

interface EnrichmentData {
  [key: string]: unknown
}

interface Props {
  severity: Record<string, SevData>
  contracts: ContractData[]
  scope: ScopeData
  slug: string
  program_rules?: string[]
  submission_requirements?: SubmissionReqs
  eligibility?: string[]
  enrichment?: EnrichmentData | null
}

export default function ProtocolDetailClient({
  severity, contracts, scope, slug, program_rules, submission_requirements, eligibility, enrichment
}: Props) {
  const [expanded, setExpanded] = useState<string | null>('critical')
  const [tab, setTab] = useState<'scope' | 'contracts' | 'submission'>('scope')
  const sevEntries = Object.entries(severity)
  const hasContracts = contracts.length > 0
  const hasCritFns = (scope.functions_critical?.length ?? 0) > 0
  const hasHighFns = (scope.functions_high?.length ?? 0) > 0
  const hasSubmission = submission_requirements?.report_format && submission_requirements.report_format.length > 0
  const hasEligibility = eligibility && eligibility.length > 0
  const hasRules = program_rules && program_rules.length > 0

  return (
    <>
      {/* ─── 01: SEVERITY TIERS ─── */}
      {sevEntries.length > 0 && (
        <section className="pd-section">
          <h2 className="pd-heading"><span className="pd-num">01</span>Severity & Rewards</h2>
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

      {/* ─── 02: PROGRAM RULES ─── */}
      {hasRules && (
        <section className="pd-section">
          <h2 className="pd-heading"><span className="pd-num">02</span>Program Rules</h2>
          <ol className="pd-rules-list">
            {program_rules!.map((rule, i) => (
              <li key={i}>
                <span className="pd-rules-num">{String(i + 1).padStart(2, '0')}</span>
                {rule}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ─── 03: TAB NAV — Scope / Contracts / Submission Format ─── */}
      <div className="pd-tabs">
        <button type="button" className={`pd-tab ${tab === 'scope' ? 'active' : ''}`} onClick={() => setTab('scope')}>
          Scope
        </button>
        <button type="button" className={`pd-tab ${tab === 'contracts' ? 'active' : ''}`} onClick={() => setTab('contracts')}>
          Contracts{hasContracts ? ` (${contracts.filter(c => c.type === 'Bounty Scope').length} in scope · ${contracts.length} total)` : ''}
        </button>
        <button type="button" className={`pd-tab ${tab === 'submission' ? 'active' : ''}`} onClick={() => setTab('submission')}>
          Submission Format
        </button>
      </div>

      {/* ─── SCOPE TAB ─── */}
      {tab === 'scope' && (
        <section className="pd-scope-grid">
          <div className="pd-scope-panel pd-scope-in">
            <h3 className="pd-scope-title in">✓ IN SCOPE</h3>
            <ul className="pd-scope-list">
              {scope.in_scope.length > 0 ? scope.in_scope.map((item, i) => (
                <li key={i}><span className="pd-scope-bullet in">●</span>{item}</li>
              )) : <li className="pd-empty">Scope details pending verification.</li>}
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

      {/* ─── CONTRACTS TAB ─── */}
      {tab === 'contracts' && (
        <section className="pd-contracts">
          {hasContracts ? contracts.map((c, i) => {
            const explorer = EXPLORERS[c.network?.toLowerCase()]
            return (
              <div key={i} className="pd-contract">
                <div className="pd-contract-info">
                  <div className="pd-contract-head">
                    <span className="pd-contract-name">{c.name}</span>
                    <span className={`pd-contract-type ${c.type === 'Bounty Scope' ? 'pd-contract-type--scope' : c.type === 'Out of Scope' ? 'pd-contract-type--out' : ''}`}>{c.type}</span>
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
              <p>Contract addresses are being mapped for this program.</p>
              <p className="pd-empty-hint">Verified addresses will appear here as security researchers complete scope analysis. You can still submit findings referencing specific contracts.</p>
            </div>
          )}
        </section>
      )}

      {/* ─── SUBMISSION FORMAT TAB ─── */}
      {tab === 'submission' && (
        <section className="pd-submission">
          {hasSubmission && (
            <div className="pd-sub-section">
              <h3 className="pd-sub-title">📋 Report Requirements</h3>
              <p className="pd-sub-intro">
                All submissions must follow this format to be eligible for review and payout.
                Incomplete reports may be closed without evaluation.
              </p>
              <ol className="pd-sub-list">
                {submission_requirements!.report_format!.map((item, i) => (
                  <li key={i}>
                    <span className="pd-sub-num">{String(i + 1).padStart(2, '0')}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {submission_requirements?.severity_criteria && (
            <div className="pd-sub-section">
              <h3 className="pd-sub-title">🎯 Severity Classification Guide</h3>
              <div className="pd-sev-criteria">
                {Object.entries(submission_requirements.severity_criteria).map(([level, desc]) => {
                  const c = SEV[level] || SEV.low
                  return (
                    <div key={level} className="pd-sev-crit-row" style={{ borderLeftColor: c.dot }}>
                      <span className="pd-sev-crit-level" style={{ color: c.dot }}>{level.toUpperCase()}</span>
                      <span className="pd-sev-crit-desc">{desc}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {hasEligibility && (
            <div className="pd-sub-section">
              <h3 className="pd-sub-title">🔑 Eligibility</h3>
              <ul className="pd-elig-list">
                {eligibility!.map((item, i) => (
                  <li key={i}>
                    <span className="pd-elig-check">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!hasSubmission && !hasEligibility && (
            <div className="pd-empty-block">
              <p>Submission format requirements are being standardized for this program.</p>
            </div>
          )}
        </section>
      )}

      {/* ─── ENRICHMENT: LINKS & INFO ─── */}
      {enrichment && (() => {
        const str = (key: string): string | null => {
          const v = enrichment[key]
          return typeof v === 'string' && v ? v : null
        }
        const twitterUrl = (handle: string): string => {
          if (handle.startsWith('http')) return handle
          return `https://x.com/${handle.replace(/^@/, '')}`
        }

        const socials: { label: string; url: string; icon: string }[] = []
        if (str('twitter')) socials.push({ label: 'Twitter', url: twitterUrl(str('twitter')!), icon: '𝕏' })
        if (str('discord')) socials.push({ label: 'Discord', url: str('discord')!, icon: '💬' })
        if (str('telegram')) socials.push({ label: 'Telegram', url: str('telegram')!, icon: '✈' })
        if (str('reddit_url')) socials.push({ label: 'Reddit', url: str('reddit_url')!, icon: '◉' })

        const resources: { label: string; url: string; icon: string }[] = []
        if (str('website_url')) resources.push({ label: 'Website', url: str('website_url')!, icon: '◆' })
        if (str('docs_url')) resources.push({ label: 'Docs', url: str('docs_url')!, icon: '📄' })
        if (str('developer_docs_url')) resources.push({ label: 'Dev Docs', url: str('developer_docs_url')!, icon: '⚙' })
        if (str('github_url')) resources.push({ label: 'GitHub', url: str('github_url')!, icon: '⌥' })
        if (str('whitepaper_url')) resources.push({ label: 'Whitepaper', url: str('whitepaper_url')!, icon: '📑' })
        if (str('blog_url')) resources.push({ label: 'Blog', url: str('blog_url')!, icon: '✎' })
        if (str('status_page_url')) resources.push({ label: 'Status', url: str('status_page_url')!, icon: '●' })
        if (str('bounty_policy_url')) resources.push({ label: 'Bounty Policy', url: str('bounty_policy_url')!, icon: '🛡' })

        const emails: { label: string; email: string }[] = []
        if (str('security_email')) emails.push({ label: 'Security', email: str('security_email')! })
        if (str('contact_email')) emails.push({ label: 'Contact', email: str('contact_email')! })
        if (str('legal_email')) emails.push({ label: 'Legal', email: str('legal_email')! })

        const auditorList: string[] = Array.isArray(enrichment.auditors) ? (enrichment.auditors as unknown[]).filter((a): a is string => typeof a === 'string') : []

        const auditUrls: string[] = Array.isArray(enrichment.audit_report_urls) ? (enrichment.audit_report_urls as unknown[]).filter((u): u is string => typeof u === 'string') : []

        const marketCapRank = typeof enrichment.market_cap_rank === 'number' ? enrichment.market_cap_rank : null
        const hasAnything = socials.length > 0 || resources.length > 0 || emails.length > 0 || auditorList.length > 0 || marketCapRank

        if (!hasAnything) return null

        return (
          <section className="pd-section pd-enrich">
            <div className="pd-enrich-glow" />
            <div className="pd-enrich-glow pd-enrich-glow-2" />
            <h2 className="pd-heading"><span className="pd-num">★</span>Protocol Information</h2>

            {/* Social + Market row */}
            {(socials.length > 0 || marketCapRank) && (
              <div className="pd-enrich-row">
                {socials.map(s => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="pd-social-card">
                    <span className="pd-social-icon">{s.icon}</span>
                    <span className="pd-social-name">{s.label}</span>
                    <span className="pd-social-arrow">↗</span>
                  </a>
                ))}
                {marketCapRank && (
                  <div className="pd-social-card pd-rank-card">
                    <span className="pd-social-icon">📊</span>
                    <span className="pd-social-name">Rank</span>
                    <span className="pd-rank-value">#{marketCapRank}</span>
                  </div>
                )}
              </div>
            )}

            {/* Resources grid */}
            {resources.length > 0 && (
              <div className="pd-enrich-block">
                <span className="pd-enrich-label">Resources</span>
                <div className="pd-resource-grid">
                  {resources.map(r => (
                    <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" className="pd-resource-link">
                      <span className="pd-resource-icon">{r.icon}</span>
                      <span className="pd-resource-name">{r.label}</span>
                      <span className="pd-resource-arrow">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Auditors */}
            {auditorList.length > 0 && (
              <div className="pd-enrich-block">
                <span className="pd-enrich-label">Audited By</span>
                <div className="pd-auditor-grid">
                  {auditorList.map(a => (
                    <div key={a} className="pd-auditor-chip">
                      <span className="pd-auditor-dot" />
                      {a}
                    </div>
                  ))}
                </div>
                {auditUrls.length > 0 && (
                  <div className="pd-audit-reports">
                    <span className="pd-enrich-sublabel">{auditUrls.length} Audit Report{auditUrls.length > 1 ? 's' : ''}</span>
                    <div className="pd-audit-links">
                      {auditUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="pd-audit-link">
                          Report #{i + 1} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contacts */}
            {emails.length > 0 && (
              <div className="pd-enrich-block">
                <span className="pd-enrich-label">Security Contacts</span>
                <div className="pd-contact-grid">
                  {emails.map(e => (
                    <a key={e.label} href={`mailto:${e.email}`} className="pd-contact-card">
                      <span className="pd-contact-type">{e.label}</span>
                      <span className="pd-contact-email">{e.email}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        )
      })()}

      {/* ─── CTA ─── */}
      <div className="pd-cta">
        <a href={`/submit?protocol=${slug}`} className="pd-btn-primary">Submit Finding →</a>
        <a href="/bounties" className="pd-btn-secondary">← Browse All Programs</a>
      </div>

      <div className="pd-meta">
        <span>Bounty program indexed and verified by WhiteClaws</span>
        <span>Program data sourced from on-chain analysis and public bounty disclosures.</span>
      </div>
    </>
  )
}
