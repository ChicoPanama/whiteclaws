import SiteLayout from '@/components/shell/SiteLayout'
import { getResearchers } from '@/lib/data/researchers'

export const dynamic = 'force-dynamic'

interface Params {
  params: { handle: string }
}

export default async function ResearcherProfilePage({ params }: Params) {
  const researchers = await getResearchers()
  const researcher = researchers.find((entry) => entry.handle === params.handle)

  if (!researcher) {
    return (
      <SiteLayout>
        <div className="nb">
          <h3>Researcher not found</h3>
          <p>We couldn&apos;t locate that profile.</p>
        </div>
      </SiteLayout>
    )
  }

  return (
    <SiteLayout>
      <div className="section-reveal visible">
        <div className="sh">
          <span className="num">Profile</span>
          <h2>@{researcher.handle}</h2>
          <span className="lk">Rank #{researcher.rank}</span>
        </div>
        <div className="dg">
          <div className="terminal">
            <div className="tb">
              <span className="td r"></span>
              <span className="td y"></span>
              <span className="td g"></span>
              <span className="tl">researcher-stats</span>
            </div>
            <div className="tc">
              <div>Total earnings: {researcher.earned}</div>
              <div>Findings: {researcher.findings}</div>
              <div>Criticals: {researcher.critical}</div>
            </div>
          </div>
          <div className="nb">
            <h3>Recent findings</h3>
            <p>Recent findings will appear here once activity is synced.</p>
            <div style={{ marginTop: 16 }}>
              <span className="btn btn-secondary">View reports</span>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
