export const metadata = { title: 'Terms of Service | WhiteClaws' }

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 24, color: 'var(--ink)' }}>Terms of Service</h1>
      <p style={{ color: 'var(--ink-2)', lineHeight: 1.7 }}>
        WhiteClaws is a coordination and encryption layer for decentralized bug bounty programs.
        By using this platform, you agree to follow responsible disclosure practices.
        Full terms will be published before the $WC token launch.
      </p>
      <p style={{ color: 'var(--muted)', marginTop: 24, fontSize: '.85rem' }}>
        Last updated: February 2026
      </p>
    </main>
  )
}
