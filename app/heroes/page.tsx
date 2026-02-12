import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import WallOfHeroes from '@/components/heroes/WallOfHeroes'
import { getHeroes, getAggregateStats } from '@/lib/data/heroes'

export const metadata = {
  title: 'Wall of Heroes — WhiteClaws',
  description: 'The whitehats protecting DeFi. 141 security researchers who have earned $107M finding vulnerabilities.',
}

export default function HeroesPage() {
  const heroes = getHeroes()
  const stats = getAggregateStats()

  return (
    <>
      <Nav />
      <div className="hw-page">
        <div className="section">
          <div className="sh">
            <h2>Wall of Heroes</h2>
            <span className="lk">{stats.heroCount} whitehats</span>
          </div>
          <p className="sd-text">
            The elite security researchers protecting DeFi. Every hero on this wall has found real vulnerabilities and earned real bounties.
          </p>
          <WallOfHeroes heroes={heroes} stats={stats} />
        </div>
      </div>
      <Footer />
    </>
  )
}
