import Nav from '@/components/landing/Nav'
import type { Row } from '@/lib/supabase/helpers'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function normalizeHttpUrl(input: string): string {
  const v = input.trim()
  if (!v) return v
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  return `https://${v}`
}

function toTwitterUrl(input: string): string {
  const v = input.trim()
  if (!v) return v
  if (v.includes('twitter.com/') || v.includes('x.com/')) return normalizeHttpUrl(v)
  const handle = v.startsWith('@') ? v.slice(1) : v
  return `https://x.com/${handle}`
}

function safeArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x) => typeof x === 'string' && x.trim().length > 0) as string[]
}

async function getBountyDetail(slug: string) {
  try {
    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      // Include enrichment fields populated by scrapers (DeFiLlama, CoinGecko, etc.).
      .select(`
        id, slug, name, description, category, chains, max_bounty, logo_url,
        website_url, github_url, github_org, docs_url, developer_docs_url,
        immunefi_url, immunefi_slug, security_email, contact_email, legal_email,
        twitter, discord, telegram,
        whitepaper_url, bounty_policy_url, status_page_url, reddit_url, blog_url,
        coingecko_id, market_cap_rank,
        auditors, audit_report_urls
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
        <div className="section">
          <div className="sh"><h2>Bounty Not Found</h2></div>
          <p className="sd-text">No active bounty program found for this protocol.</p>
          <Link href="/bounties" style={{ color: 'var(--text-link, #3b82f6)' }}>Back to Bounties</Link>
        </div>
        <Footer />
      </>
    )
  }

  const { protocol, program, scope, totalFindings, acceptedFindings } = data
  const auditReportUrls = safeArray((protocol as any).audit_report_urls)
  const auditorsRaw = (protocol as any).auditors
  const auditors =
    Array.isArray(auditorsRaw)
      ? auditorsRaw
          .map((a: any) => (typeof a === 'string' ? a : (a?.name || a?.auditor || '')))
          .filter((s: string) => typeof s === 'string' && s.trim().length > 0)
      : []

  const links: Array<{ label: string; href: string }> = []
  if ((protocol as any).website_url) links.push({ label: 'Website', href: normalizeHttpUrl((protocol as any).website_url) })
  if ((protocol as any).docs_url) links.push({ label: 'Docs', href: normalizeHttpUrl((protocol as any).docs_url) })
  if ((protocol as any).developer_docs_url) links.push({ label: 'Developer Docs', href: normalizeHttpUrl((protocol as any).developer_docs_url) })
  if ((protocol as any).github_url) links.push({ label: 'GitHub', href: normalizeHttpUrl((protocol as any).github_url) })
  if ((protocol as any).status_page_url) links.push({ label: 'Status Page', href: normalizeHttpUrl((protocol as any).status_page_url) })
  if ((protocol as any).bounty_policy_url) links.push({ label: 'Bounty Policy', href: normalizeHttpUrl((protocol as any).bounty_policy_url) })
  if ((protocol as any).whitepaper_url) links.push({ label: 'Whitepaper', href: normalizeHttpUrl((protocol as any).whitepaper_url) })
  if ((protocol as any).blog_url) links.push({ label: 'Blog', href: normalizeHttpUrl((protocol as any).blog_url) })
  if ((protocol as any).reddit_url) links.push({ label: 'Reddit', href: normalizeHttpUrl((protocol as any).reddit_url) })
  if ((protocol as any).immunefi_url) links.push({ label: 'Immunefi', href: normalizeHttpUrl((protocol as any).immunefi_url) })
  if ((protocol as any).coingecko_id) links.push({ label: 'CoinGecko', href: `https://www.coingecko.com/en/coins/${(protocol as any).coingecko_id}` })

  const socials: Array<{ label: string; href: string }> = []
  if ((protocol as any).twitter) socials.push({ label: 'X / Twitter', href: toTwitterUrl((protocol as any).twitter) })
  if ((protocol as any).discord) socials.push({ label: 'Discord', href: normalizeHttpUrl((protocol as any).discord) })
  if ((protocol as any).telegram) socials.push({ label: 'Telegram', href: normalizeHttpUrl((protocol as any).telegram) })

  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>{protocol.name}</h2>
        </div>
        <p className="sd-text">{protocol.description}</p>

        <div className="bg-hero-stats">
          <div className="bg-hero-stat">
            <span className="bg-hero-stat-value">${Number(program?.max_payout || protocol.max_bounty || 0).toLocaleString()}</span>
            <span className="bg-hero-stat-label">Max Bounty</span>
          </div>
          <div className="bg-hero-stat">
            <span className="bg-hero-stat-value">{totalFindings || 0}</span>
            <span className="bg-hero-stat-label">Findings</span>
          </div>
          <div className="bg-hero-stat">
            <span className="bg-hero-stat-value">{acceptedFindings || 0}</span>
            <span className="bg-hero-stat-label">Accepted</span>
          </div>
          <div className="bg-hero-stat">
            <span className="bg-hero-stat-value">{(protocol.chains || []).join(', ') || 'Multi-chain'}</span>
            <span className="bg-hero-stat-label">Chains</span>
          </div>
        </div>

        {/* Program Details */}
        {program && (
          <div className="ap-card" style={{ marginTop: '24px' }}>
            <h2 className="ap-card-title">Program Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              <div><strong>Status:</strong> {program.status}</div>
              <div><strong>Currency:</strong> {program.payout_currency}</div>
              <div><strong>Min Payout:</strong> ${Number(program.min_payout).toLocaleString()}</div>
              <div><strong>Max Payout:</strong> ${Number(program.max_payout).toLocaleString()}</div>
              <div><strong>PoC Required:</strong> {program.poc_required ? 'Yes' : 'No'}</div>
              <div><strong>KYC Required:</strong> {program.kyc_required ? 'Yes' : 'No'}</div>
              <div><strong>Duplicate Policy:</strong> {program.duplicate_policy}</div>
              <div><strong>Response SLA:</strong> {program.response_sla_hours}h</div>
            </div>
          </div>
        )}

        {/* Scope */}
        {scope && (
          <div className="ap-card" style={{ marginTop: '16px' }}>
            <h2 className="ap-card-title">Scope (v{scope.version})</h2>

            {scope.in_scope && scope.in_scope.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <strong>In Scope:</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {scope.in_scope.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}

            {scope.out_of_scope && scope.out_of_scope.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Out of Scope:</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {scope.out_of_scope.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}

            {scope.contracts && Array.isArray(scope.contracts) && scope.contracts.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Contracts:</strong>
                {(scope.contracts as Array<{ name?: string; address?: string; chain?: string }>).map((c, i: number) => (
                  <div key={i} style={{ padding: '6px', background: 'var(--bg-secondary, #111)', borderRadius: '4px', margin: '4px 0', fontSize: '13px' }}>
                    {c.name || 'Contract'} — <code>{c.address}</code> ({c.chain})
                  </div>
                ))}
              </div>
            )}

            {scope.severity_definitions && (
              <div>
                <strong>Severity Tiers:</strong>
                {Object.entries(scope.severity_definitions as Record<string, { min: number; max: number; description: string }>).map(([level, def]) => (
                  <div key={level} style={{ padding: '6px', background: 'var(--bg-secondary, #111)', borderRadius: '4px', margin: '4px 0', fontSize: '13px' }}>
                    <strong style={{ textTransform: 'capitalize' }}>{level}:</strong> ${def.min.toLocaleString()} – ${def.max.toLocaleString()} — {def.description}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Links */}
        <div className="ap-card" style={{ marginTop: '16px' }}>
          <h2 className="ap-card-title">Links</h2>
          {(links.length > 0 || socials.length > 0) ? (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--text-link, #3b82f6)' }}
                >
                  {l.label}
                </a>
              ))}
              {socials.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--text-link, #3b82f6)' }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          ) : (
            <p className="ap-card-text" style={{ opacity: 0.75 }}>No links found for this protocol yet.</p>
          )}

          {(protocol as any).security_email || (protocol as any).contact_email || (protocol as any).legal_email ? (
            <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {(protocol as any).security_email && (
                <a href={`mailto:${(protocol as any).security_email}`} style={{ color: 'var(--text-link, #3b82f6)' }}>
                  Security Email
                </a>
              )}
              {(protocol as any).contact_email && (
                <a href={`mailto:${(protocol as any).contact_email}`} style={{ color: 'var(--text-link, #3b82f6)' }}>
                  Contact Email
                </a>
              )}
              {(protocol as any).legal_email && (
                <a href={`mailto:${(protocol as any).legal_email}`} style={{ color: 'var(--text-link, #3b82f6)' }}>
                  Legal Email
                </a>
              )}
            </div>
          ) : null}

          {(auditors.length > 0 || auditReportUrls.length > 0 || typeof (protocol as any).market_cap_rank === 'number') ? (
            <div style={{ marginTop: 14 }}>
              {typeof (protocol as any).market_cap_rank === 'number' ? (
                <div className="wc-field-helper" style={{ marginTop: 4 }}>
                  CoinGecko market cap rank: #{(protocol as any).market_cap_rank}
                </div>
              ) : null}

              {auditors.length > 0 ? (
                <div className="wc-field-helper" style={{ marginTop: 6 }}>
                  Auditors: {auditors.join(', ')}
                </div>
              ) : null}

              {auditReportUrls.length > 0 ? (
                <div style={{ marginTop: 10 }}>
                  <div className="wc-field-helper" style={{ marginBottom: 6 }}>Audit reports</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {auditReportUrls.map((u) => (
                      <a
                        key={u}
                        href={normalizeHttpUrl(u)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--text-link, #3b82f6)' }}
                      >
                        Report
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Submit CTA */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <Link href={`/submit?protocol=${protocol.slug}`} className="ap-btn-primary">Submit Finding</Link>
          <Link href="/bounties" style={{ color: 'var(--text-link, #3b82f6)', display: 'flex', alignItems: 'center' }}>Back to Bounties</Link>
        </div>
      </div>
      <Footer />
    </>
  )
}
