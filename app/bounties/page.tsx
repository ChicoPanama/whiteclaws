import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import BountyGrid from '@/components/BountyGrid'
import { getJSONBounties } from '@/lib/data/bounties'

export default function BountiesPage() {
  const bounties = getJSONBounties()

  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>Explore Bounties</h2>
          <span className="lk">{bounties.length} programs</span>
        </div>
        <p className="sd-text">
          Find the highest-value bug bounties across DeFi, L2s, bridges, and infrastructure.
        </p>
        <BountyGrid bounties={bounties} />
      </div>
      <Footer />
    </>
  )
}
