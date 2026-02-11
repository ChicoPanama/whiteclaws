import Link from 'next/link'

export default function ProtocolLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav style={{ borderBottom: '1px solid var(--border, #222)', padding: '12px 24px', display: 'flex', gap: '16px', fontSize: '14px' }}>
        <Link href="/app/protocol/dashboard" style={{ opacity: 0.7 }}>Dashboard</Link>
        <Link href="/app/protocol/findings" style={{ opacity: 0.7 }}>Findings</Link>
        <Link href="/app/protocol/scope" style={{ opacity: 0.7 }}>Scope</Link>
        <Link href="/app/protocol/payouts" style={{ opacity: 0.7 }}>Payouts</Link>
        <Link href="/app/protocol/settings" style={{ opacity: 0.7 }}>Settings</Link>
      </nav>
      {children}
    </div>
  )
}
