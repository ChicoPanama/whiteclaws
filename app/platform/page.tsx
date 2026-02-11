import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { platformFeatures } from '@/lib/data/constants'

export default function PlatformPage() {
  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>Platform</h2>
        </div>
        <p className="sd-text">
          Every security tool your protocol needs — unified, automated, and built for agents.
        </p>
        <div className="pg">
          {platformFeatures.map((f) => (
            <Link key={f.slug} href={`/platform/${f.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="pi" style={{ cursor: 'pointer', position: 'relative' }}>
                {f.comingSoon && (
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#888',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    padding: '2px 8px',
                  }}>
                    Coming Soon
                  </span>
                )}
                <span className="pi-ic">{f.icon}</span>
                <div className="pi-nm">{f.name}</div>
                <div className="pi-ds">{f.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
