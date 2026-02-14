'use client'

interface EnrichmentData {
  [key: string]: unknown
}

interface Props {
  enrichment: EnrichmentData
}

export default function BountyEnrichment({ enrichment }: Props) {
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
  if (str('immunefi_url')) resources.push({ label: 'Immunefi', url: str('immunefi_url')!, icon: '🐛' })

  const emails: { label: string; email: string }[] = []
  if (str('security_email')) emails.push({ label: 'Security', email: str('security_email')! })
  if (str('contact_email')) emails.push({ label: 'Contact', email: str('contact_email')! })
  if (str('legal_email')) emails.push({ label: 'Legal', email: str('legal_email')! })

  const auditorList: string[] = Array.isArray(enrichment.auditors)
    ? (enrichment.auditors as unknown[])
        .map((a) => (typeof a === 'string' ? a : (a as Record<string, string>)?.name || (a as Record<string, string>)?.auditor || ''))
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : []

  const auditUrls: string[] = Array.isArray(enrichment.audit_report_urls)
    ? (enrichment.audit_report_urls as unknown[]).filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    : []

  const marketCapRank = typeof enrichment.market_cap_rank === 'number' ? enrichment.market_cap_rank : null
  const coingeckoId = str('coingecko_id')

  const hasAnything = socials.length > 0 || resources.length > 0 || emails.length > 0 || auditorList.length > 0 || marketCapRank

  if (!hasAnything) return null

  if (coingeckoId && !resources.find(r => r.label === 'CoinGecko')) {
    resources.push({ label: 'CoinGecko', url: `https://www.coingecko.com/en/coins/${coingeckoId}`, icon: '📊' })
  }

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
}
