'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Home', href: '/' },
  { label: 'Bounties', href: '/bounties' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Platform', href: '/platform' },
  { label: 'Research', href: '/learn' },
  { label: 'About', href: '/about' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="nav">
      <div className="nav-left">
        <Link href="/" className="nav-logo">
          <div className="logo-mark">🦞</div>
          WhiteClaws
          <span className="nav-badge">beta</span>
        </Link>
        <div className="nav-tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`nav-tab ${pathname === tab.href ? 'active' : ''}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="nav-right">
        <button className="btn btn-ghost">Log In</button>
        <button className="btn btn-primary">Get Protected</button>
      </div>
    </nav>
  )
}
