import SiteNav from '@/components/nav/SiteNav'
import LandingFooter from '@/components/landing/Footer'
import Link from 'next/link'
import Button from '@/components/ui/Button'

const appLinks = [
  { label: 'Dashboard', href: '/app' },
  { label: 'Agents', href: '/app/agents' },
  { label: 'Access', href: '/app/access' },
  { label: 'Settings', href: '/app/settings' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <SiteNav />
      <div className="section" style={{ paddingTop: 40, borderBottom: 'none' }}>
        <div className="flex flex-wrap gap-4 mb-8">
          {appLinks.map((link) => (
            <Button key={link.href} as={Link} href={link.href} variant="outline" size="sm">
              {link.label}
            </Button>
          ))}
        </div>
        {children}
      </div>
      <LandingFooter />
    </div>
  )
}
