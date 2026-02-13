import Nav from '@/components/landing/Nav'
import type { Row } from '@/lib/supabase/helpers'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getBountyDetail(slug: string) {
  try {
    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      .select('id, slug, name, description, category, chains, max_bounty, logo_url, website_url, github_url')
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
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {protocol.website_url && <a href={protocol.website_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-link, #3b82f6)' }}>Website</a>}
            {protocol.github_url && <a href={protocol.github_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-link, #3b82f6)' }}>GitHub</a>}
          </div>
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
