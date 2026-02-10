import AboutSection from '@/components/landing/AboutSection'
import BountiesPreview from '@/components/landing/BountiesPreview'
import DeploySection from '@/components/landing/DeploySection'
import FindingsPreview from '@/components/landing/FindingsPreview'
import Footer from '@/components/landing/Footer'
import Hero from '@/components/landing/Hero'
import LeaderboardPreview from '@/components/landing/LeaderboardPreview'
import Marquee from '@/components/landing/Marquee'
import Nav from '@/components/landing/Nav'
import PlatformGrid from '@/components/landing/PlatformGrid'
import Stats from '@/components/landing/Stats'
import type { Bounty } from '@/lib/data/types'

export default function Landing({ bounties }: { bounties: Bounty[] }) {
  return (
    <>
      <Nav />
      <Hero />
      <Marquee />
      <Stats />
      <DeploySection />
      <BountiesPreview bounties={bounties} />
      <LeaderboardPreview />
      <PlatformGrid />
      <FindingsPreview />
      <AboutSection />
      <Footer />
    </>
  )
}
