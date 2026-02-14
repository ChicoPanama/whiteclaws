import Nav from '@/components/landing/Nav'
import type { Row } from '@/lib/supabase/helpers'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/admin'
import ProtocolIcon from '@/components/ProtocolIcon'
import BountyEnrichment from '@/components/bounty/BountyEnrichment'

export const dynamic = 'force-dynamic'

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

async function getBountyDetail(slug: string) {
  try {
    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      .select(`
        id, slug, name, description, category, chains, max_bounty, logo_url,
        website_url, github_url, github_org, docs_url, developer_docs_url,
        immunefi_url, immunefi_slug, security_email, contact_email, legal_email,
        twitter, discord, telegram,
        whitepaper_url, bounty_policy_url, status_page_url, reddit_url, blog_url,
        coingecko_id, market_cap_rank,
        auditors, audit_report_urls, verified
      `)
      .eq('slug', slug)
      .returns<Row<'protocols'>[]>().maybeSingle()

    if (!protocol) return null

    const { data: program } = await supabase
      .from('programs')
      .select('*')
      .eq('protocol_id', protocol.id)
      .eq('status', 'active')
      .returns<Row<'programs'>[]>().maybeSingle()

    const { data: scope } = program ? await supabase
      .from('program_scopes')
      .select('*')
      .eq('program_id', program.id)
      .order('version', { ascending: false })
      .limit(1)
      .returns<Row<'program_scopes'>[]>().maybeSingle() : { data: null }

    const { count: totalFindings } = await supabase
      .from('findings')
      .select('id', { count: 'exact', head: true })
      .eq('protocol_id', protocol.id)

    const { count: acceptedFindings } = await supabase
      .from('findings')
      .select('id', { count: 'exact', head: true })
      .eq('protocol_id', protocol.id)
      .in('status', ['accepted', 'paid'])

    return { protocol, program, scope, totalFindings, acceptedFindings }
  } catch {
    return null
  }
}

export default async function BountyDetailPage({ params }: { params: { slug: string } }) {
  const data = await getBountyDetail(params.slug)

  if (!data) {
    return (
      <>
        <Nav />
        <div className="pd-page">
          <div className="pd-wrap">
            <div className="pd-hero">
              <h1 className="pd-hero-name">Bounty Not Found</h1>
              <p className="pd-hero-desc">No active bounty program found for this protocol.</p>
            </div>
            <div className="pd-cta">
              <Link href="/bounties" className="pd-btn-secondary">← Back to Bounties</Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const { protocol, program, scope, totalFindings, acceptedFindings } = data

  const chains = protocol.chains || []
  const maxChainShow = 8
  const visibleChains = chains.slice(0, maxChainShow)
  const extraChains = chains.length - maxChainShow

  // Build enrichment object from protocol row for the enrichment component
  const enrichment: Record<string, unknown> = {
    website_url: protocol.website_url,
    docs_url: protocol.docs_url,
    developer_docs_url: protocol.developer_docs_url,
    github_url: protocol.github_url,
    immunefi_url: protocol.immunefi_url,
    twitter: protocol.twitter,
    discord: protocol.discord,
    telegram: protocol.telegram,
    security_email: protocol.security_email,
    contact_email: protocol.contact_email,
    legal_email: protocol.legal_email,
    whitepaper_url: protocol.whitepaper_url,
    bounty_policy_url: protocol.bounty_policy_url,
    status_page_url: protocol.status_page_url,
    reddit_url: protocol.reddit_url,
    blog_url: protocol.blog_url,
    coingecko_id: protocol.coingecko_id,
    market_cap_rank: protocol.market_cap_rank,
    auditors: protocol.auditors,
    audit_report_urls: protocol.audit_report_urls,
  }

  // Build severity entries from scope severity_definitions
  const sevEntries = scope?.severity_definitions
    ? Object.entries(scope.severity_definitions as Record<string, { min: number; max: number; description: string }>)
    : []

  return (
    <>
      <Nav />
      <div className="pd-page">
        <div className="pd-wrap">

          <a href="/bounties" className="pd-back">← All Bounties</a>

          {/* ─── HERO HEADER ─── */}
          <header className="pd-hero">
            <div className="pd-hero-orb" />

            <div className="pd-hero-top">
              <div className="pd-hero-icon">
                <ProtocolIcon name={protocol.name} logo_url={protocol.logo_url} size={52} />
              </div>
              <div className="pd-hero-text">
                <div className="pd-hero-name-row">
                  <h1 className="pd-hero-name">{protocol.name}</h1>
                  {protocol.verified && <span className="pd-badge-verified">✓ VERIFIED</span>}
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
              {protocol.category && <span className="pd-badge brand">{protocol.category}</span>}
              {program?.kyc_required && <span className="pd-badge warn">KYC Required</span>}
              {program?.poc_required && <span className="pd-badge info">PoC Required</span>}
            </div>
          </header>

          {/* ─── STATS BAR ─── */}
          <div className="pd-stats">
            <div className="pd-stat">
              <span className="pd-stat-label">Max Bounty</span>
              <span className="pd-stat-value accent">
                ${Number(program?.max_payout || protocol.max_bounty || 0).toLocaleString()}
              </span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-label">Min Bounty</span>
              <span className="pd-stat-value">
                ${Number(program?.min_payout || 0).toLocaleString()}
              </span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-label">Findings</span>
              <span className="pd-stat-value">{totalFindings || 0}</span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-label">Accepted</span>
              <span className="pd-stat-value">{acceptedFindings || 0}</span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-label">Chains</span>
              <span className="pd-stat-value">{chains.length || '—'}</span>
            </div>
          </div>

          {/* ─── SEVERITY TIERS ─── */}
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
                  return (
                    <div key={level} className="pd-sev-card" style={{ background: c.bg, borderColor: c.border }}>
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
                      <div className="pd-sev-detail" style={{ borderColor: c.border }}>
                        <p className="pd-sev-desc">{data.description}</p>
                        <div className="pd-sev-range">
                          <span>Min: <strong>${data.min?.toLocaleString()}</strong></span>
                          <span>Max: <strong>${data.max?.toLocaleString()}</strong></span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ─── PROGRAM DETAILS ─── */}
          {program && (
            <section className="pd-section">
              <h2 className="pd-heading"><span className="pd-num">02</span>Program Details</h2>
              <div className="pd-stats" style={{ marginTop: 16 }}>
                <div className="pd-stat">
                  <span className="pd-stat-label">Status</span>
                  <span className="pd-stat-value">{program.status}</span>
                </div>
                <div className="pd-stat">
                  <span className="pd-stat-label">Currency</span>
                  <span className="pd-stat-value">{program.payout_currency}</span>
                </div>
                <div className="pd-stat">
                  <span className="pd-stat-label">Response SLA</span>
                  <span className="pd-stat-value">{program.response_sla_hours}h</span>
                </div>
                <div className="pd-stat">
                  <span className="pd-stat-label">Duplicate Policy</span>
                  <span className="pd-stat-value">{program.duplicate_policy}</span>
                </div>
              </div>
            </section>
          )}

          {/* ─── SCOPE ─── */}
          {scope && (
            <section className="pd-section">
              <h2 className="pd-heading"><span className="pd-num">03</span>Scope (v{scope.version})</h2>
              <div className="pd-scope-grid">
                <div className="pd-scope-panel pd-scope-in">
                  <h3 className="pd-scope-title in">✓ IN SCOPE</h3>
                  <ul className="pd-scope-list">
                    {scope.in_scope && scope.in_scope.length > 0
                      ? scope.in_scope.map((item: string, i: number) => (
                          <li key={i}><span className="pd-scope-bullet in">●</span>{item}</li>
                        ))
                      : <li className="pd-empty">Scope details pending verification.</li>
                    }
                  </ul>
                </div>
                <div className="pd-scope-panel pd-scope-out">
                  <h3 className="pd-scope-title out">✕ OUT OF SCOPE</h3>
                  <ul className="pd-scope-list">
                    {scope.out_of_scope && scope.out_of_scope.length > 0
                      ? scope.out_of_scope.map((item: string, i: number) => (
                          <li key={i}><span className="pd-scope-bullet out">●</span>{item}</li>
                        ))
                      : <li className="pd-empty">No exclusions listed.</li>
                    }
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* ─── ENRICHMENT: LINKS & INFO ─── */}
          <BountyEnrichment enrichment={enrichment} />

          {/* ─── CTA ─── */}
          <div className="pd-cta">
            <Link href={`/submit?protocol=${protocol.slug}`} className="pd-btn-primary">Submit Finding →</Link>
            <Link href="/bounties" className="pd-btn-secondary">← Browse All Programs</Link>
          </div>

          <div className="pd-meta">
            <span>Bounty program indexed and verified by WhiteClaws</span>
            <span>Program data sourced from on-chain analysis and public bounty disclosures.</span>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
