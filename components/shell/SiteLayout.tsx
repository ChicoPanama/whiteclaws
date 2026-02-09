import SiteNav from '@/components/nav/SiteNav'
import LandingFooter from '@/components/landing/Footer'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <SiteNav />
      <main className="section" style={{ borderBottom: 'none' }}>
        {children}
      </main>
      <LandingFooter />
    </div>
  )
}
