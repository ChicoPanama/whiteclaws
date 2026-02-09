import Link from 'next/link'
import SiteLayout from '@/components/shell/SiteLayout'
import PageShell from '@/components/shell/PageShell'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Pill from '@/components/ui/Pill'
import Select from '@/components/ui/Select'
import { getBounties } from '@/lib/data/bounties'

export const dynamic = 'force-dynamic'

export default async function BountiesPage() {
  const bounties = await getBounties()

  return (
    <SiteLayout>
      <PageShell
        title="Explore bounties"
        subtitle="Discover security programs, review scope details, and submit findings with confidence."
        actions={
          <Button as={Link} href="/submit" variant="primary">
            Submit finding
          </Button>
        }
      >
        <div className="page-filters">
          <Input placeholder="Search protocols" aria-label="Search protocols" />
          <Select defaultValue="all" aria-label="Filter by network">
            <option value="all">All networks</option>
            <option value="ethereum">Ethereum</option>
            <option value="l2">Layer 2</option>
            <option value="bridge">Bridge</option>
          </Select>
          <Button variant="ghost">Sort: Highest reward</Button>
        </div>

        <div className="page-pills">
          <Pill active>All</Pill>
          <Pill>DeFi</Pill>
          <Pill>Infrastructure</Pill>
          <Pill>Bridges</Pill>
          <Pill>Layer 2</Pill>
        </div>

        <div className="page-grid">
          {bounties.map((bounty) => (
            <Card
              key={bounty.id}
              as={Link}
              href={`/bounties/${bounty.id}`}
              interactive
            >
              <div className="ui-card-meta">
                <span className="ui-card-badge">{bounty.category}</span>
                <span>{bounty.tags?.[0] ?? 'Program'}</span>
                <span>{bounty.language ?? 'Solidity'}</span>
              </div>
              <div>
                <div className="ui-card-title">{bounty.name}</div>
                <div className="ui-card-subtitle">Live since {bounty.liveSince}</div>
              </div>
              <div className="ui-card-meta">
                <span>Max reward</span>
                <strong>{bounty.maxReward ?? bounty.reward}</strong>
              </div>
              <div className="ui-card-meta">
                {bounty.chains.map((chain) => (
                  <span key={chain} className="ui-card-badge">
                    {chain}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </PageShell>
    </SiteLayout>
  )
}
