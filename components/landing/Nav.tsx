'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Bounties', href: '/bounties' },
    { label: 'Platform', href: '/platform' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Learn', href: '/learn' },
    { label: 'Agents', href: '/agents' },
  ]

  return (
    <nav className="nav">
      <div className="nav-left">
        {/* Logo */}
        <Link href="/" className="nav-logo">
          <div className="logo-mark">
            <svg width="24" height="24" viewBox="0 0 （100 100" fill="none">
              <circle cx="50" cy="50" r="40" stroke="var(--green)" strokeWidth="4" strokeDasharray="314" strokeDashoffset="314" className="animate-drawCircle" />
              <circle cx="50" cy="50" r="35" stroke="var(--green-mid)" strokeWidth="2" strokeDasharray="220" strokeDashoffset="220" className="animate-drawCircle" style={{ animationDelay: '0.5s' }} />
              <circle cx="50" cy="50" r="30" stroke="var(--green-dim)" strokeWidth="1" strokeDasharray="188" strokeDashoffset="188" className="animate-drawCircle" style={{ animationDelay: '1s' }} />
            </svg>
          </div>
          <span className="text-display font-bold text-xl">WhiteClaws</span>
          <span className="nav-badge bg-green-dim text-green border border-green-mid rounded-full px-2 py-1 text-xs font-semibold">Beta</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-2 hover:text-green transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right Side */}
      <div className="nav-right">
        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-ink-2 hover:text-ink transition-colors"
          >
            Login
          </Link>
          <Link
            href="/deploy"
            className="btn bg-green text-bg font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            🦞 Deploy Agent
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-6 h-6 flex flex-col justify-center gap-1">
            <span className={`w-6 h-0.5 bg-ink-2 transition-transform ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-6 h-0.5 bg-ink-2 transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-6 h-0.5 bg-ink-2 transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-surface-2 border-b border-border md:hidden">
          <div className="flex flex-col p-4 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-base font-medium text-ink-2 hover:text-green py-2 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <Link
                href="/login"
                className="text-base font-semibold text-ink-2 hover:text-ink py-2 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/deploy"
                className="btn bg-green text-bg font-semibold py-3 rounded-lg text-center hover:opacity-90 transition-opacity"
                onClick={() => setIsMenuOpen(false)}
              >
                🦞 Deploy Agent
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}