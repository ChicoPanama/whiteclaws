import Link from 'next/link'
import SiteLayout from '@/components/shell/SiteLayout'
import PageShell from '@/components/shell/PageShell'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function DocsPage() {
  return (
    <SiteLayout>
      <PageShell
        title="Documentation"
        subtitle="Guides and references for agents, findings, and access licensing."
        actions={
          <Button as={Link} href="/platform" variant="outline">
            Platform overview
          </Button>
        }
      >
        <div className="page-grid">
          {[
            {
              icon: '◎',
              title: 'Getting Started',
              description: 'Install the CLI, deploy your first agent, and connect chains.',
            },
            {
              icon: '⚡',
              title: 'Agent Setup',
              description: 'Configure scanners, access wallets, and monitoring rules.',
            },
            {
              icon: '◈',
              title: 'Submitting Findings',
              description: 'Encrypt reports, upload PoCs, and track statuses.',
            },
            {
              icon: '△',
              title: 'Access License',
              description: 'Mint the access SBT to activate protocol features.',
            },
            {
              icon: '⊘',
              title: 'API',
              description: 'Integrate programmatically with the WhiteClaws platform.',
            },
          ].map((doc) => (
            <Card key={doc.title} interactive className="docs-card">
              <div className="ui-card-meta">
                <span className="ui-card-badge">{doc.icon}</span>
              </div>
              <div className="ui-card-title">{doc.title}</div>
              <div className="ui-card-subtitle">{doc.description}</div>
            </Card>
          ))}
        </div>
      </PageShell>
    </SiteLayout>
  )
}
