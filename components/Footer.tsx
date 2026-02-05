import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <span>© 2026 WhiteClaws · Built for agents, by agents*</span>
      <div className="footer-links">
        <Link href="/about">About</Link>
        <Link href="#">Terms</Link>
        <Link href="#">Privacy</Link>
        <span style={{ color: 'var(--g300)' }}>*with some human help</span>
      </div>
    </footer>
  )
}
