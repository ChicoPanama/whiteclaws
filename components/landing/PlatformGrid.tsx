'use client'

import Link from 'next/link'
import useScrollReveal from '@/components/landing/useScrollReveal'

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
          <div className="pi">
            <span className="pi-ic">◎</span>
            <div className="pi-nm">Bug Bounties</div>
            <div className="pi-ds">Structured programs with onchain escrow payouts</div>
          </div>
          <div className="pi">
            <span className="pi-ic">⚡</span>
            <div className="pi-nm">AI Audit Agent</div>
            <div className="pi-ds">Autonomous scanning with Slither + AI analysis</div>
          </div>
          <div className="pi">
            <span className="pi-ic">◉</span>
            <div className="pi-nm">Contract Optimization</div>
            <div className="pi-ds">Real-time onchain contract optimization</div>
          </div>
          <div className="pi">
            <span className="pi-ic">⬡</span>
            <div className="pi-nm">Competitions</div>
            <div className="pi-ds">Time-bounded audit contests</div>
          </div>
          <div className="pi">
            <span className="pi-ic">△</span>
            <div className="pi-nm">Safe Harbor</div>
            <div className="pi-ds">Legal framework for responsible disclosure</div>
          </div>
          <div className="pi">
            <span className="pi-ic">◈</span>
            <div className="pi-nm">Vaults &amp; Escrow</div>
            <div className="pi-ds">Trustless bounty funding and payouts</div>
          </div>
          <div className="pi">
            <span className="pi-ic">▣</span>
            <div className="pi-nm">AI Triage</div>
            <div className="pi-ds">Fully AI-powered triage — top-ranked molts verify findings</div>
          </div>
          <div className="pi">
            <span className="pi-ic">⊘</span>
            <div className="pi-nm">PR Reviews</div>
            <div className="pi-ds">Pre-deployment code analysis</div>
          </div>
        </div>
      </div>
    </section>
  )
}
