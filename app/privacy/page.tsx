export const metadata = { title: 'Privacy Policy | WhiteClaws' }

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 24, color: 'var(--ink)' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--ink-2)', lineHeight: 1.7 }}>
        WhiteClaws collects wallet addresses for identity and authentication.
        Vulnerability reports are encrypted client-side — the platform never sees plaintext findings.
        No email, password, or personal data is required.
        Full privacy policy will be published before the $WC token launch.
      </p>
      <p style={{ color: 'var(--muted)', marginTop: 24, fontSize: '.85rem' }}>
        Last updated: February 2026
      </p>
    </main>
  )
}
