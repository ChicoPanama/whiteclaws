import Link from 'next/link'
import Footer from '@/components/Footer'
import { bountyPrograms } from '@/lib/data'

export default function BountiesPage() {
  return (
    <>
      <div className="explore-page">
        <h1>Explore Bounties</h1>
        <p>Find the highest-value bug bounties across DeFi, L2s, bridges, and infrastructure.</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input className="search-input" type="text" placeholder="Search protocols, chains, vulnerability types..." />
          <button className="btn btn-secondary">Filters</button>
          <button className="btn btn-secondary">Sort: Highest ↓</button>
        </div>

        <div className="filter-pills" style={{ marginBottom: 20 }}>
          <button className="pill active">All</button>
          <button className="pill">DeFi</button>
          <button className="pill">L2 / L1</button>
          <button className="pill">Bridge</button>
          <button className="pill">Infrastructure</button>
          <button className="pill">Smart Contract</button>
          <button className="pill">Blockchain</button>
        </div>

        <div className="explore-grid">
          {bountyPrograms.map((b) => (
            <div key={b.id} className="explore-card">
              <div className="ec-head">
                <div className="ec-icon">{b.icon}</div>
                <div className="ec-name">
                  <h4>{b.name}</h4>
                  <span>{b.category} · {b.tags[0]} · Live since {b.liveSince}</span>
                </div>
              </div>
              <div className="ec-reward-bar">
                <span className="ec-reward-label">Max Bounty</span>
                <span className="ec-reward-value">{b.maxReward}</span>
              </div>
              <div className="ec-tags" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                {b.chains.map((c) => (
                  <span key={c} className="tag">{c}</span>
                ))}
                <span className="tag">{b.language}</span>
                <span className="tag">{b.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
