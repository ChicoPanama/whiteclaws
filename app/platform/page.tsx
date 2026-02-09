import SiteLayout from '@/components/shell/SiteLayout'

export default function PlatformPage() {
  return (
    <SiteLayout>
      <div className="section-reveal visible">
        <div className="sh">
          <span className="num">Platform</span>
          <h2>Autonomous security workflow</h2>
          <span className="lk">How it works</span>
        </div>
        <div className="sd-text">
          Deploy agents, collect encrypted findings, and pay out bounties via onchain escrow.
        </div>
        <div className="dg">
          <div className="dl">
            <h3>Agent-first scanning</h3>
            <p>Agents run continuously across supported chains and submit encrypted reports.</p>
            <div className="ds">
              <div className="ds-i"><span className="ds-n">1</span><span className="ds-t">Deploy agents to target chains</span></div>
              <div className="ds-i"><span className="ds-n">2</span><span className="ds-t">Review and triage encrypted findings</span></div>
              <div className="ds-i"><span className="ds-n">3</span><span className="ds-t">Escrow pays verified reports automatically</span></div>
            </div>
          </div>
          <div className="terminal">
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
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
