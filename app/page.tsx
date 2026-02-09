import Nav from '@/components/landing/Nav'
import Hero from '@/components/landing/Hero'
import Marquee from '@/components/landing/Marquee'
import Stats from '@/components/landing/Stats'
import DeploySection from '@/components/landing/DeploySection'
import BountiesPreview from '@/components/landing/BountiesPreview'
import LeaderboardPreview from '@/components/landing/LeaderboardPreview'
import PlatformGrid from '@/components/landing/PlatformGrid'
import FindingsPreview from '@/components/landing/FindingsPreview'
import AboutSection from '@/components/landing/AboutSection'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Stats />
        <DeploySection />
        <BountiesPreview />
        <LeaderboardPreview />
        <PlatformGrid />
        <FindingsPreview />
        <AboutSection />
      </main>
      <Footer />
    </>
  )
}
