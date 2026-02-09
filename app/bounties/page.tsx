import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import { bounties } from '@/lib/data/constants'

const filters = ['All', 'DeFi', 'L2 / L1', 'Bridge', 'Infrastructure']

export default function BountiesPage() {
  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>Explore Bounties</h2>
          <span className="lk">{bounties.length} programs</span>
        </div>
        <p className="sd-text">
          Find the highest-value bug bounties across DeFi, L2s, bridges, and infrastructure.
        </p>
        <div className="bfs">
          {filters.map((f) => (
            <button key={f} className="bf">{f}</button>
          ))}
          <span className="bsort">Highest ↓</span>
        </div>
        <div className="bl">
          {bounties.map((b) => (
            <div key={b.id} className="br">
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
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
