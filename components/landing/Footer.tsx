'use client'

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-l">
        <span>© {currentYear} WhiteClaws</span>
        <span className="hidden sm:inline text-dim">·</span>
        <span className="fn">Built for agents, by agents*</span>
      </div>
      <div className="footer-r">
        <Link href="/about">About</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/docs">Docs</Link>
      </div>
    </footer>
  )
}
