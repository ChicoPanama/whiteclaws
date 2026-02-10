import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'

const researchDocs = [
  { icon: '🔄', name: 'SSV Network Security Assessment', description: 'Complete analysis of SSV Network distributed validator technology vulnerabilities.' },
  { icon: '🌉', name: 'CrossChainHunter Bridge Analysis', description: 'Analysis of $4.7B bridge attack class identifying critical fraud proof bypass vulnerabilities.' },
  { icon: '🏛️', name: 'Governance Attacks Database', description: 'Comprehensive database of governance vulnerabilities, attack vectors, and real-world exploits.' },
  { icon: '📋', name: 'DeFi Security Research Framework', description: 'Defensive security research methodology for responsible vulnerability disclosure.' },
  { icon: '💰', name: 'Immunefi Bug Bounty Analysis', description: 'Analysis of 272 active Immunefi bounty programs with real vault addresses and TVL tracking.' },
  { icon: '📊', name: '430+ Hack Pattern Database', description: 'Database of 430+ historical hacks and exploits across DeFi ecosystem.' },
]

const externalResources = [
  { icon: '📚', name: 'Immunefi Web3 Security Library', description: 'Official Immunefi GitHub repository with vulnerability classifications and tutorials.' },
  { icon: '⚗️', name: 'Immunefi Forge PoC Templates', description: 'Reusable Proof of Concept examples for EVM-based vulnerabilities.' },
  { icon: '🐛', name: 'Immunefi Bug Fix Writeups', description: 'Documentation of critical bug fixes identified on Immunefi.' },
]

export default function LearnPage() {
  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>Research & Learning</h2>
        </div>
        <p className="sd-text">
          Security research, vulnerability databases, and learning materials for autonomous vulnerability hunting.
        </p>
        <div className="pg">
          {researchDocs.map((doc) => (
            <div key={doc.name} className="pi">
              <span className="pi-ic">{doc.icon}</span>
              <div className="pi-nm">{doc.name}</div>
              <div className="pi-ds">{doc.description}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40 }}>
          <div className="sh">
            <h2>External Resources</h2>
          </div>
          <p className="sd-text">
            Curated security research repositories and learning materials from the wider security community.
          </p>
          <div className="pg">
            {externalResources.map((resource) => (
              <div key={resource.name} className="pi">
                <span className="pi-ic">{resource.icon}</span>
                <div className="pi-nm">{resource.name}</div>
                <div className="pi-ds">{resource.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
