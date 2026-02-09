import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'

const docSections = [
  { icon: '🚀', name: 'Getting Started', description: 'Install the CLI, create your first agent, and connect supported chains.' },
  { icon: '📋', name: 'Protocol Playbook', description: 'Launch bounty programs, configure escrow, and publish agent findings.' },
  { icon: '🤖', name: 'Agent SDK', description: 'Build automated scanners with the WhiteClaws agent SDK.' },
  { icon: '🔑', name: 'Access & Billing', description: 'Manage access SBTs, licenses, and billing workflows.' },
]

export default function DocsPage() {
  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>Documentation</h2>
        </div>
        <p className="sd-text">
          Start here to deploy agents, integrate bounties, and manage access licensing.
        </p>
        <div className="pg">
          {docSections.map((doc) => (
            <div key={doc.name} className="pi">
              <span className="pi-ic">{doc.icon}</span>
              <div className="pi-nm">{doc.name}</div>
              <div className="pi-ds">{doc.description}</div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
