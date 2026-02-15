'use client'

import Link from 'next/link'
import useScrollReveal from '@/components/landing/useScrollReveal'
import { platformFeatures } from '@/lib/data/constants'

export default function PlatformGrid() {
  const revealRef = useScrollReveal()

  const core = platformFeatures.filter((f) => f.tier === 'core')
  const support = platformFeatures.filter((f) => f.tier === 'support')
  const coming = platformFeatures.filter((f) => f.tier === 'coming')

  return (
    <section className="section">
      <div className="section-reveal" ref={revealRef}>
        <div className="sh">
          <span className="num">04 / 06</span>
          <h2>Platform</h2>
          <Link href="/platform" className="lk">All Features →</Link>
        </div>
        <div className="sd-text">
          A complete security infrastructure for the onchain economy.
        </div>

        {/* ── Core products: large cards with dynamic effects ── */}
        <div className="pg-core">
          {core.map((f) => (
            <Link key={f.slug} href={`/platform/${f.slug}`} className="ob-link-reset">
              <div className="pg-core-card">
                <div className="pg-core-glow" />
                <div className="pg-core-content">
                  <span className="pg-core-icon">{f.icon}</span>
                  <div>
                    <div className="pg-core-name">{f.name}</div>
                    <div className="pg-core-desc">{f.description}</div>
                  </div>
                  <span className="pg-core-arrow">→</span>
                </div>
                <div className="pg-core-highlights">
                  {f.highlights.slice(0, 3).map((h, i) => (
                    <span key={i} className="pg-core-hl">
                      <span className="pg-core-hl-dot" />
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Supporting features: medium cards ── */}
        <div className="pg-support">
          {support.map((f) => (
            <Link key={f.slug} href={`/platform/${f.slug}`} className="ob-link-reset">
              <div className="pg-support-card">
                <span className="pg-support-icon">{f.icon}</span>
                <div className="pg-support-name">{f.name}</div>
                <div className="pg-support-desc">{f.description}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Coming soon: dimmed, smaller ── */}
        {coming.length > 0 && (
          <div className="pg-coming">
            {coming.map((f) => (
              <div key={f.slug} className="pg-coming-card">
                <span className="pg-coming-icon">{f.icon}</span>
                <div className="pg-coming-info">
                  <div className="pg-coming-name">{f.name}</div>
                  <div className="pg-coming-desc">{f.description}</div>
                </div>
                <span className="pg-coming-badge">Coming Soon</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
