import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import { openZeppelinResearch } from '@/lib/data/constants'

const researchDocs = [
  { icon: '🔄', name: 'SSV Network Security Assessment', description: 'Complete analysis of SSV Network distributed validator technology vulnerabilities.' },
  { icon: '🌉', name: 'CrossChainHunter Bridge Analysis', description: 'Analysis of $4.7B bridge attack class identifying critical fraud proof bypass vulnerabilities.' },
  { icon: '🏛️', name: 'Governance Attacks Database', description: 'Comprehensive database of governance vulnerabilities, attack vectors, and real-world exploits.' },
  { icon: '📋', name: 'DeFi Security Research Framework', description: 'Defensive security research methodology for responsible vulnerability disclosure.' },
  { icon: '💰', name: 'WhiteClaws Bounty Intelligence', description: 'Analysis of 450+ active bounty programs with real vault addresses, TVL tracking, and severity tiers.' },
  { icon: '📊', name: '430+ Hack Pattern Database', description: 'Database of 430+ historical hacks and exploits across the DeFi ecosystem.' },
]

const externalResources = [
  { icon: '📚', name: 'OpenZeppelin Security Library', description: 'Industry-standard smart contract security patterns, audited implementations, and best practices.' },
  { icon: '⚗️', name: 'Foundry PoC Templates', description: 'Reusable Proof of Concept frameworks for EVM-based vulnerability verification using Forge.' },
  { icon: '🐛', name: 'DeFi Hack Postmortems', description: 'Detailed breakdowns of major DeFi exploits with root cause analysis and prevention strategies.' },
  { icon: '🔍', name: 'Slither Static Analysis', description: 'Trail of Bits Solidity static analysis framework for automated vulnerability detection.' },
  { icon: '🛡️', name: 'Smart Contract Weakness Classification', description: 'SWC Registry — comprehensive taxonomy of known smart contract vulnerabilities and test cases.' },
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
            Curated security research tools and libraries from the wider security community.
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
