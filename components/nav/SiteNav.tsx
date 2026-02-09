'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Bounties', href: '/bounties' },
  { label: 'Researchers', href: '/researchers' },
  { label: 'Platform', href: '/platform' },
  { label: 'Docs', href: '/docs' },
  { label: 'App', href: '/app' },
]

export default function SiteNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()

  return (
    <nav className="nav">
      <div className="nav-left">
        <Link href="/" className="nav-brand" aria-label="WhiteClaws home">
          <div className="logo-circle-wrap">
            <svg className="logo-circle-svg" viewBox="0 0 44 44" aria-hidden="true">
              <circle className="logo-circle-glow" cx="22" cy="22" r="20" />
              <circle className="logo-circle-path" cx="22" cy="22" r="20" />
            </svg>
            <div className="logo-lobster">
              <span className="emoji-white">🦞</span>
            </div>
          </div>
          WhiteClaws
        </Link>
        <div className="nav-links">
          {links.map((link) => {
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? 'active' : undefined}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
      <div className="nav-right">
        <span className="nav-tag">Beta</span>
        <Link href={isAuthenticated ? '/app' : '/login'} className="btn btn-g">
          {isAuthenticated ? 'Dashboard' : 'Log In'}
        </Link>
        <Link href="/app/access" className="btn btn-w">
          Get Protected <span className="arr">→</span>
        </Link>
      </div>
    </nav>
  )
}
