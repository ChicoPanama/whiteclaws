'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function Nav() {
  const { isAuthenticated } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navLinks = [
    { href: '/bounties', label: 'Bounties' },
    { href: '/heroes', label: 'Heroes' },
    { href: '/researchers', label: 'Researchers' },
    { href: '/agents', label: 'Agents' },
    { href: '/platform', label: 'Platform' },
    { href: '/docs', label: 'Docs' },
  ]

  return (
    <>
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
            {navLinks.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          </div>
        </div>
        <div className="nav-right">
          <span className="nav-tag">Beta</span>
          <Link href={isAuthenticated ? '/app' : '/login'} className="btn btn-g">
            {isAuthenticated ? 'Dashboard' : 'Log In'}
          </Link>
          <Link href="/bounties" className="btn btn-w">
            Get Started <span className="arr">→</span>
          </Link>
        </div>
        <button
          className="ob-hamburger"
          onClick={() => setDrawerOpen(!drawerOpen)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="ob-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <aside className="ob-drawer" onClick={e => e.stopPropagation()}>
            <button className="ob-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
              ✕
            </button>
            <div className="ob-drawer-links">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setDrawerOpen(false)}>
                  {l.label}
                </Link>
              ))}
              <Link href={isAuthenticated ? '/app' : '/login'} onClick={() => setDrawerOpen(false)} className="ob-drawer-cta">
                {isAuthenticated ? 'Dashboard' : 'Log In'}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
