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
            <div key={f.name} className="pi">
              <span className="pi-ic">{f.icon}</span>
              <div className="pi-nm">{f.name}</div>
              <div className="pi-ds">{f.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
