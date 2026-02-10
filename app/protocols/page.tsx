import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import ProtocolIcon from '@/components/ProtocolIcon'
import { getJSONBounties } from '@/lib/data/bounties'

export default function ProtocolsPage() {
  const bounties = getJSONBounties()

  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>Protocols</h2>
          <span className="lk">{bounties.length} protocols</span>
        </div>
        <div className="bl">
          {bounties.map((b) => (
            <Link key={b.id} href={`/protocols/${b.id}`} className="br" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="bi">
                <ProtocolIcon name={b.name} logo_url={b.logo_url} size={36} />
              </div>
              <div className="bn-w">
                <div className="bn">{b.name}</div>
                <div className="bt">
                  <span>{Array.isArray(b.category) ? b.category[0] : b.category}</span>
                </div>
              </div>
              <div className="brt">
                <div className="ba">{b.reward}</div>
                <div className="bc">
                  {b.chains.map((c) => (
                    <span key={c} className="bch">{c}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
