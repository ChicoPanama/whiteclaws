import Link from 'next/link'
import SiteLayout from '@/components/shell/SiteLayout'
import PageShell from '@/components/shell/PageShell'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { loadProjectsIndex } from '@/lib/content/fsIndex'

export default async function ProtocolsPage() {
  const protocols = loadProjectsIndex().sort((a, b) => a.name.localeCompare(b.name))

  return (
    <SiteLayout>
      <PageShell
        title="Active programs"
        subtitle="Explore protocol profiles, scope coverage, and linked resources."
        actions={
          <Button as={Link} href="/bounties" variant="outline">
            View bounties
          </Button>
        }
      >
        <div className="page-grid">
          {protocols.map((protocol) => (
            <Card key={protocol.slug} as={Link} href={`/protocols/${protocol.slug}`} interactive>
              <div className="ui-card-meta">
                {protocol.tags.map((tag) => (
                  <span key={tag} className="ui-card-badge">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="ui-card-title">{protocol.name}</div>
              <div className="ui-card-subtitle">{protocol.description || 'No description yet.'}</div>
              <div className="ui-card-meta">
                {protocol.chains.length > 0 ? (
                  protocol.chains.map((chain) => (
                    <span key={chain} className="ui-card-badge">
                      {chain}
                    </span>
                  ))
                ) : (
                  <span className="ui-card-badge">Multi-chain</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </PageShell>
    </SiteLayout>
  )
}
