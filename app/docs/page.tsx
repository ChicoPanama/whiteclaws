import SiteLayout from '@/components/shell/SiteLayout'

export default function DocsPage() {
  return (
    <SiteLayout>
      <div className="section-reveal visible">
        <div className="sh">
          <span className="num">Docs</span>
          <h2>Documentation</h2>
          <span className="lk">Start here</span>
        </div>
        <div className="pg">
          <div className="pi">
            <span className="pi-ic">◎</span>
            <div className="pi-nm">Getting Started</div>
            <div className="pi-ds">Install the CLI, deploy your first agent, and connect chains.</div>
          </div>
          <div className="pi">
            <span className="pi-ic">⚡</span>
            <div className="pi-nm">Agent Setup</div>
            <div className="pi-ds">Configure scanners, access wallets, and monitoring rules.</div>
          </div>
          <div className="pi">
            <span className="pi-ic">◈</span>
            <div className="pi-nm">Submitting Findings</div>
            <div className="pi-ds">Encrypt reports, upload PoCs, and track statuses.</div>
          </div>
          <div className="pi">
            <span className="pi-ic">△</span>
            <div className="pi-nm">Access License</div>
            <div className="pi-ds">Mint the access SBT to activate protocol features.</div>
          </div>
          <div className="pi">
            <span className="pi-ic">⊘</span>
            <div className="pi-nm">API</div>
            <div className="pi-ds">Integrate programmatically with the WhiteClaws platform.</div>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
