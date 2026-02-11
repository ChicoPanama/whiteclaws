import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { platformFeatures } from '@/lib/data/constants'

export function generateStaticParams() {
  return platformFeatures.map((f) => ({ slug: f.slug }))
}

export default function FeaturePage({ params }: { params: { slug: string } }) {
  const feature = platformFeatures.find((f) => f.slug === params.slug)
  if (!feature) return notFound()

  return (
    <>
      <Nav />
      <div className="section" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link href="/platform" className="lk" style={{ marginBottom: '24px', display: 'inline-block' }}>
          ← All Features
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <span style={{ fontSize: '2.5rem' }}>{feature.icon}</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{feature.name}</h1>
          {feature.comingSoon && (
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#888',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '3px 10px',
              whiteSpace: 'nowrap',
            }}>
              Coming Soon
            </span>
          )}
        </div>

        <p style={{ fontSize: '1.1rem', color: '#aaa', lineHeight: 1.7, margin: '24px 0 32px' }}>
          {feature.longDescription}
        </p>

        <div style={{
          border: '1px solid #222',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666', marginBottom: '16px' }}>
            Highlights
          </div>
          {feature.highlights.map((h, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '10px 0',
              borderTop: i > 0 ? '1px solid #1a1a1a' : 'none',
            }}>
              <span style={{ color: '#4ade80', fontSize: '0.9rem', flexShrink: 0, marginTop: '2px' }}>✓</span>
              <span style={{ color: '#ccc', lineHeight: 1.5 }}>{h}</span>
            </div>
          ))}
        </div>

        {/* CTA section */}
        {!feature.comingSoon ? (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {feature.slug === 'bounties' && (
              <Link href="/bounties" className="bn" style={{ textDecoration: 'none' }}>
                Browse Bounties →
              </Link>
            )}
            {feature.slug === 'agents' && (
              <Link href="/agents" className="bn" style={{ textDecoration: 'none' }}>
                View Agents →
              </Link>
            )}
            {feature.slug === 'openclaw' && (
              <Link href="/skill.md" className="bn" style={{ textDecoration: 'none' }}>
                View skill.md →
              </Link>
            )}
            {feature.slug === 'hack-database' && (
              <Link href="/learn" className="bn" style={{ textDecoration: 'none' }}>
                Browse Exploits →
              </Link>
            )}
            {feature.slug === 'leaderboard' && (
              <Link href="/leaderboard" className="bn" style={{ textDecoration: 'none' }}>
                View Leaderboard →
              </Link>
            )}
          </div>
        ) : (
          <div style={{
            border: '1px solid #222',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            color: '#666',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🚧</div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Under Construction</div>
            <div style={{ fontSize: '0.9rem' }}>This feature is being built. Check back soon.</div>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
