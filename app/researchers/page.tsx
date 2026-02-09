import Link from 'next/link'
import SiteLayout from '@/components/shell/SiteLayout'
import PageShell from '@/components/shell/PageShell'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { getResearchers } from '@/lib/data/researchers'

export const dynamic = 'force-dynamic'

export default async function ResearchersPage() {
  const researchers = await getResearchers()

  return (
    <SiteLayout>
      <PageShell
        title="Top researchers"
        subtitle="Track the most impactful whitehats and their verified earnings."
        actions={
          <Button as={Link} href="/submit" variant="outline">
            Submit a finding
          </Button>
        }
      >
        <div className="page-filters">
          <Input placeholder="Search researchers..." aria-label="Search researchers" />
          <Button variant="ghost">Search</Button>
        </div>

        <div className="page-stack">
          {researchers.map((researcher) => (
            <Card
              key={researcher.id}
              as={Link}
              href={`/researchers/${researcher.handle}`}
              interactive
              className="researcher-card"
            >
              <div className="ui-card-meta">
                <span className="ui-card-badge">Rank {String(researcher.rank).padStart(2, '0')}</span>
                <span>Verified researcher</span>
              </div>
              <div className="ui-card-title">{researcher.handle}</div>
              <div className="ui-card-subtitle">{researcher.earned} total rewards</div>
            </Card>
          ))}
        </div>
      </PageShell>
    </SiteLayout>
  )
}
