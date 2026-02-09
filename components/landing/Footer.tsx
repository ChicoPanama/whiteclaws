import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const buildStamp =
    process.env.NEXT_PUBLIC_BUILD_STAMP ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
    'local'

  return (
    <footer className="footer">
      <span className="footer-l">© {currentYear} WhiteClaws</span>
      <div className="footer-r">
        <Link href="/about">About</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/docs">Docs</Link>
        <span className="fn">*with some human help</span>
        <span className="footer-build">Build {buildStamp}</span>
      </div>
    </footer>
  )
}
