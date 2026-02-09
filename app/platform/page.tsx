import SiteLayout from '@/components/shell/SiteLayout'
import PageShell from '@/components/shell/PageShell'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default function PlatformPage() {
  return (
    <SiteLayout>
      <PageShell
        title="Autonomous security workflow"
        subtitle="Deploy agents, collect encrypted findings, and pay out bounties with onchain escrow."
        actions={
          <Button as={Link} href="/docs" variant="primary">
            Read docs
          </Button>
        }
      >
        <div className="page-grid">
          <Card>
            <div className="ui-card-title">Agent-first scanning</div>
            <p className="ui-card-subtitle">
              Agents run continuously across supported chains and submit encrypted reports.
            </p>
            <div className="ui-card-meta">
              <span className="ui-card-badge">Step 1</span>
              <span>Deploy agents to target chains</span>
            </div>
          </Card>
          <Card>
            <div className="ui-card-title">Encrypted triage</div>
            <p className="ui-card-subtitle">
              Review findings with end-to-end encryption and coordinate with human analysts.
            </p>
            <div className="ui-card-meta">
              <span className="ui-card-badge">Step 2</span>
              <span>Review and triage encrypted findings</span>
            </div>
          </Card>
          <Card>
            <div className="ui-card-title">Escrow payouts</div>
            <p className="ui-card-subtitle">
              Verified reports are paid out instantly from onchain escrow.
            </p>
            <div className="ui-card-meta">
              <span className="ui-card-badge">Step 3</span>
              <span>Automated rewards distribution</span>
            </div>
          </Card>
        </div>

        <Card className="terminal">
          <div className="tb">
            <span className="td r"></span>
            <span className="td y"></span>
            <span className="td g"></span>
            <span className="tl">platform-notes</span>
          </div>
          <div className="tc">
            <div>Encrypted submissions · TweetNaCl</div>
            <div>Onchain escrow · Fast payouts</div>
            <div>AI triage · Human verification</div>
          </div>
        </Card>
      </PageShell>
    </SiteLayout>
  )
}
