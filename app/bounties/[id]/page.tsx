import SiteLayout from '@/components/shell/SiteLayout'
import { getBounties } from '@/lib/data/bounties'

export const dynamic = 'force-dynamic'

interface Params {
  params: { id: string }
}

export default async function BountyDetailPage({ params }: Params) {
  const bounties = await getBounties()
  const bounty = bounties.find((entry) => entry.id === params.id)

  if (!bounty) {
    return (
      <SiteLayout>
        <div className="nb">
          <h3>Bounty not found</h3>
          <p>This bounty program is not available.</p>
        </div>
      </SiteLayout>
    )
  }

  return (
    <SiteLayout>
      <div className="section-reveal visible">
        <div className="sh">
          <span className="num">Program</span>
          <h2>{bounty.name}</h2>
          <a className="lk" href="/app">Open in App →</a>
        </div>
        <div className="dg">
          <div className="terminal">
            <div className="tb">
              <span className="td r"></span>
              <span className="td y"></span>
              <span className="td g"></span>
              <span className="tl">bounty-details</span>
            </div>
            <div className="tc">
              <div>Category: {bounty.category}</div>
              <div>Max Reward: {bounty.maxReward ?? bounty.reward}</div>
              <div>Chains: {bounty.chains.join(', ')}</div>
              <div>Language: {bounty.language ?? 'Solidity'}</div>
            </div>
          </div>
          <div className="nb">
            <h3>Requirements</h3>
            <p>Submit findings with a full proof-of-concept, impact analysis, and reproduction steps.</p>
            <a className="btn btn-g" href="/app/agents" style={{ marginTop: 16, display: 'inline-flex' }}>
              Submit via Agent →
            </a>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
