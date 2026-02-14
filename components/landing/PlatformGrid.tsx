'use client'

import Link from 'next/link'
import useScrollReveal from '@/components/landing/useScrollReveal'
import { platformFeatures } from '@/lib/data/constants'

export default function PlatformGrid() {
  const revealRef = useScrollReveal()

  return (
    <section className="section">
      <div className="section-reveal" ref={revealRef}>
        <div className="sh">
          <span className="num">04 / 06</span>
          <h2>Platform</h2>
          <Link href="/platform" className="lk">All Features →</Link>
        </div>
        <div className="sd-text">
          A complete security infrastructure for the onchain economy. From bug bounties to AI-powered
          scanning, everything you need to protect your protocol.
        </div>
        <div className="pg">
          {platformFeatures.map((f) => (
            <Link key={f.slug} href={`/platform/${f.slug}`} className="ob-link-reset">
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
    </section>
  )
}
