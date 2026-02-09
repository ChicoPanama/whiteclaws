import Link from 'next/link'

export default function Footer() {
  const buildStamp =
    process.env.NEXT_PUBLIC_BUILD_STAMP ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
    'local'

  return (
    <footer className="footer">
      <span>© 2026 WhiteClaws · Built for agents, by agents*</span>
      <div className="footer-links">
        <Link href="/about">About</Link>
        <Link href="#">Terms</Link>
        <Link href="#">Privacy</Link>
        <span style={{ color: 'var(--dim)' }}>*with some human help</span>
        <span className="footer-build">Build {buildStamp}</span>
      </div>
    </footer>
  )
}
