import Link from 'next/link'
import SiteLayout from '@/components/shell/SiteLayout'
import { getBounties } from '@/lib/data/bounties'

export const dynamic = 'force-dynamic'

export default async function BountiesPage() {
  const bounties = await getBounties()

  return (
    <SiteLayout>
      <div className="section-reveal visible">
        <div className="sh">
          <span className="num">Bounties</span>
          <h2>Explore Bounties</h2>
          <span className="lk">Filters</span>
        </div>

        <div className="bfs">
          <button className="bf active">All</button>
          <button className="bf">DeFi</button>
          <button className="bf">L2 / L1</button>
          <button className="bf">Bridge</button>
          <button className="bf">Infra</button>
          <span className="bsort">Highest ↓</span>
        </div>

        <div className="bl">
          {bounties.map((bounty) => (
            <Link key={bounty.id} className="br" href={`/bounties/${bounty.id}`}>
              <div className="bi">{bounty.icon ?? bounty.name.charAt(0)}</div>
              <div className="bn-w">
                <div className="bn">{bounty.name}</div>
                <div className="bt">
                  <span>{bounty.category}</span>
                  <span>·</span>
                  <span>{bounty.tags?.[0] ?? 'Program'}</span>
                  <span>·</span>
                  <span>{bounty.language ?? 'Solidity'}</span>
                </div>
              </div>
              <div className="brt">
                <div className="ba">{bounty.maxReward ?? bounty.reward}</div>
                <div className="bc">
                  {bounty.chains.map((chain) => (
                    <span key={chain} className="bch">{chain}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  )
}
