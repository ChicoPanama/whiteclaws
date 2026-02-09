import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'

const resources = [
  { icon: '📄', name: 'Smart Contract Vulnerabilities Handbook', description: 'Comprehensive guide to common smart contract vulnerabilities' },
  { icon: '⚗️', name: 'Foundry Testing Best Practices', description: 'How to write effective PoC tests with Foundry' },
]

const audits = [
  { icon: '🔍', name: 'Oak Network Audit Report', description: 'Security audit for Oak Network PaymentTreasury' },
]

export default function ResourcesPage() {
  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>Resources</h2>
        </div>
        <p className="sd-text">Security tools, guides, and audit reports for whitehat researchers.</p>

        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>Audit Reports</h3>
          <div className="pg">
            {audits.map((a) => (
              <div key={a.name} className="pi">
                <span className="pi-ic">{a.icon}</span>
                <div className="pi-nm">{a.name}</div>
                <div className="pi-ds">{a.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>Community Resources</h3>
          <div className="pg">
            {resources.map((r) => (
              <div key={r.name} className="pi">
                <span className="pi-ic">{r.icon}</span>
                <div className="pi-nm">{r.name}</div>
                <div className="pi-ds">{r.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
