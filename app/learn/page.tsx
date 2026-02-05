import Link from 'next/link'
import Footer from '@/components/Footer'

export default function LearnPage() {
  const researchDocs = [
    {
      title: 'SSV Network Security Assessment',
      category: 'Vulnerability Research',
      bountyValue: '$1.5M-2.3M',
      description: 'Complete analysis of SSV Network distributed validator technology vulnerabilities including threshold signature reconstruction attacks, consensus manipulation, and infrastructure vulnerabilities.',
      link: '/learn/ssv-assessment',
      icon: '🔄',
      chains: ['ETH'],
      findings: 6,
      date: '2026-01-29'
    },
    {
      title: 'CrossChainHunter Bridge Analysis',
      category: 'Bridge Security',
      bountyValue: '$746M at risk',
      description: 'Analysis of $4.7B bridge attack class identifying critical fraud proof bypass vulnerabilities in Arbitrum, Base, Polygon, and Stargate bridges.',
      link: '/learn/bridge-analysis',
      icon: '🌉',
      chains: ['ETH', 'ARB', 'BASE', 'POLY'],
      findings: '5 critical',
      date: '2026-01-28'
    },
    {
      title: 'Governance Attacks Database',
      category: 'DAO Security',
      bountyValue: 'N/A',
      description: 'Comprehensive database of governance vulnerabilities, attack vectors, and real-world exploits affecting DAOs and DeFi protocols ($182M Beanstalk attack analysis).',
      link: '/learn/governance-attacks',
      icon: '🏛️',
      chains: ['Multi'],
      findings: '40+ patterns',
      date: '2026-01-28'
    },
    {
      title: 'DeFi Security Research Framework',
      category: 'Methodology',
      bountyValue: 'N/A',
      description: 'Defensive security research methodology for responsible vulnerability disclosure in DeFi protocols with $50M+ TVL. Protocol identification criteria and analysis techniques.',
      link: '/learn/defi-framework',
      icon: '📋',
      chains: ['All'],
      findings: 'Framework',
      date: '2026-01-28'
    },
    {
      title: 'Immunefi Bug Bounty Analysis',
      category: 'Platform Research',
      bountyValue: '$1M+',
      description: 'Analysis of 272 active Immunefi bounty programs with real vault addresses, TVL tracking, and payout patterns. Focus on SSV, ENS, XION, Pinto protocols.',
      link: '/learn/immunefi-analysis',
      icon: '💰',
      chains: ['ETH', 'BASE', 'XION'],
      findings: '10 active',
      date: '2026-02-04'
    },
    {
      title: '430+ Hack Pattern Database',
      category: 'Historical Analysis',
      bountyValue: '$1.6B losses',
      description: 'Database of 430+ historical hacks and exploits across DeFi ecosystem, pattern extraction for fork hunting, and vulnerability chaining analysis.',
      link: '/learn/hack-patterns',
      icon: '📊',
      chains: ['All'],
      findings: '430+ patterns',
      date: '2026-02-02'
    }
  ]

  const externalResources = [
    {
      title: 'Immunefi Web3 Security Library',
      category: 'External Resources',
      description: 'Official Immunefi GitHub repository with vulnerability classifications, tutorials, and security research materials.',
      link: 'https://github.com/immunefi-team/Web3-Security-Library',
      icon: '📚'
    },
    {
      title: 'Immunefi Forge PoC Templates',
      category: 'External Resources',
      description: 'Reusable and modifiable Proof of Concept examples for various Ethereum Virtual Machine (EVM) based vulnerabilities.',
      link: 'https://github.com/immunefi-team/forge-poc-templates',
      icon: '⚗️'
    },
    {
      title: 'Immunefi Bug Fix Writeups',
      category: 'External Resources',
      description: 'Documentation of critical bug fixes identified on Immunefi with exploit analysis and subsequent fixes.',
      link: 'https://github.com/tpiliposian/Immunefi-bugfixes',
      icon: '🐛'
    }
  ]

  return (
    <>
      <div className="explore-page">
        <h1>Research & Learning Resources</h1>
        <p>Access WhiteRabbit&apos;s proprietary security research, vulnerability databases, and learning materials for autonomous vulnerability hunting.</p>

        <div className="tabs" style={{ marginBottom: 20 }}>
          <button className="tab active">Research Documents</button>
          <button className="tab">External Resources</button>
          <button className="tab">Methodology</button>
          <button className="tab">Databases</button>
        </div>

        <div className="research-grid">
          {researchDocs.map((doc) => (
            <div key={doc.title} className="research-card">
              <div className="research-card-header">
                <div className="research-icon">{doc.icon}</div>
                <div className="research-category">{doc.category}</div>
              </div>
              <h3>{doc.title}</h3>
              <p className="research-description">{doc.description}</p>
              
              <div className="research-meta">
                <div className="research-meta-item">
                  <span className="meta-label">Bounty Value:</span>
                  <span className="meta-value">{doc.bountyValue}</span>
                </div>
                <div className="research-meta-item">
                  <span className="meta-label">Findings:</span>
                  <span className="meta-value">{doc.findings}</span>
                </div>
                <div className="research-meta-item">
                  <span className="meta-label">Date:</span>
                  <span className="meta-value">{doc.date}</span>
                </div>
              </div>

              <div className="research-chains" style={{ marginBottom: 12 }}>
                {doc.chains.map((chain) => (
                  <span key={chain} className="tag">{chain}</span>
                ))}
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '8px 16px' }}>
                View Research →
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, borderTop: '1px solid var(--g200)', paddingTop: 32 }}>
          <h2>External Resources</h2>
          <p>Curated security research repositories and learning materials from the wider security community.</p>
          
          <div className="external-resources">
            {externalResources.map((resource) => (
              <div key={resource.title} className="external-card">
                <div className="external-icon">{resource.icon}</div>
                <div>
                  <h4>{resource.title}</h4>
                  <span className="external-category">{resource.category}</span>
                  <p className="external-description">{resource.description}</p>
                  <a href={resource.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>
                    Visit Repository →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 40, backgroundColor: 'var(--g100)', borderRadius: 8, padding: 20 }}>
          <h3>📚 WhiteRabbit Research Philosophy</h3>
          <p style={{ marginBottom: 12 }}>WhiteRabbit operates on a verification-first methodology:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="step">
              <div className="step-num">1</div>
              <span><strong>Compilation verification</strong> - All PoCs must compile successfully</span>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <span><strong>Fork execution validation</strong> - Tests must pass on mainnet fork</span>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <span><strong>Parameter bounds checking</strong> - Trigger values must be reachable</span>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <span><strong>Design choice validation</strong> - Must not be intentional behavior</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}