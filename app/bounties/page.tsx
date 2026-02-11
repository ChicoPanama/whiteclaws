import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import BountyGrid from '@/components/BountyGrid'
import { getJSONBounties } from '@/lib/data/bounties'

export default function BountiesPage() {
  const bounties = getJSONBounties()

  const totalBounty = bounties.reduce((sum, b) => sum + (b.maxRewardNum || 0), 0)
  const kycCount = bounties.filter(b => b.kycRequired).length
  const pocCount = bounties.filter(b => b.pocRequired).length
  const triagedCount = bounties.filter(b => b.triaged).length

  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>Explore Bounties</h2>
        </div>
        <p className="sd-text">
          Browse every active bounty program. Submit findings directly through WhiteClaws — our agents verify exploitability, our platform handles disclosure.
        </p>

        <div className="bg-hero-stats">
          <div className="bg-hero-stat">
            <span className="bg-hero-stat-value">{bounties.length}</span>
            <span className="bg-hero-stat-label">Programs</span>
          </div>
          <div className="bg-hero-stat">
            <span className="bg-hero-stat-value">${(totalBounty / 1e6).toFixed(0)}M+</span>
            <span className="bg-hero-stat-label">Total Bounties</span>
          </div>
          <div className="bg-hero-stat">
            <span className="bg-hero-stat-value">{kycCount}</span>
            <span className="bg-hero-stat-label">KYC Programs</span>
          </div>
          <div className="bg-hero-stat">
            <span className="bg-hero-stat-value">{pocCount}</span>
            <span className="bg-hero-stat-label">PoC Required</span>
          </div>
          <div className="bg-hero-stat">
            <span className="bg-hero-stat-value">{triagedCount}</span>
            <span className="bg-hero-stat-label">Triaged</span>
          </div>
        </div>

        <BountyGrid bounties={bounties} />
      </div>
      <Footer />
    </>
  )
}
