import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { bounties } from '@/lib/data/constants'

export default function ProtocolsPage() {
  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>Protocols</h2>
        </div>
        <div className="bl">
          {bounties.map((b) => (
            <Link key={b.id} href={`/protocols/${b.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="br">
                <div className="bi">
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{b.icon}</span>
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
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
