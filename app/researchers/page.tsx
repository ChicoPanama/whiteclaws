import Link from 'next/link'
import SiteLayout from '@/components/shell/SiteLayout'
import { getResearchers } from '@/lib/data/researchers'

export const dynamic = 'force-dynamic'

export default async function ResearchersPage() {
  const researchers = await getResearchers()

  return (
    <SiteLayout>
      <div className="section-reveal visible">
        <div className="sh">
          <span className="num">Researchers</span>
          <h2>Top Whitehats</h2>
          <span className="lk">Leaderboard</span>
        </div>

        <div className="nb" style={{ marginBottom: 24 }}>
          <div className="nr">
            <input className="ni" placeholder="Search researchers..." />
            <button className="nbtn">Search</button>
          </div>
        </div>

        <div className="ll">
          {researchers.map((researcher) => (
            <Link key={researcher.id} href={`/researchers/${researcher.handle}`} className="lr">
              <span className="lrk">{String(researcher.rank).padStart(2, '0')}</span>
              <div className="lav">{researcher.handle.charAt(0).toUpperCase()}</div>
              <span className="lnm">{researcher.handle}</span>
              <span className="lvl">{researcher.earned}</span>
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  )
}
