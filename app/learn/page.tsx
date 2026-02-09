import SiteLayout from '@/components/shell/SiteLayout'

export default function LearnPage() {
  const researchDocs = [
    {
      title: 'SSV Network Security Assessment',
      description: 'Complete analysis of SSV distributed validator vulnerabilities.',
    },
    {
      title: 'CrossChainHunter Bridge Analysis',
      description: 'Bridge fraud proof bypass findings across major L2s.',
    },
    {
      title: 'Governance Attacks Database',
      description: 'Database of governance vulnerabilities and attack vectors.',
    },
    {
      title: 'DeFi Security Research Framework',
      description: 'Methodology for responsible disclosure in DeFi protocols.',
    },
  ]

  return (
    <SiteLayout>
      <div className="section-reveal visible">
        <div className="sh">
          <span className="num">Learn</span>
          <h2>Research & Learning</h2>
          <span className="lk">WhiteRabbit Labs</span>
        </div>
        <div className="pg">
          {researchDocs.map((doc) => (
            <div key={doc.title} className="pi">
              <span className="pi-ic">📚</span>
              <div className="pi-nm">{doc.title}</div>
              <div className="pi-ds">{doc.description}</div>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  )
}
