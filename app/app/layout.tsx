'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import Nav from '@/components/landing/Nav'
import { useAuth } from '@/hooks/useAuth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const meta = (user?.user_metadata || {}) as any
  const isAdmin = meta?.role === 'admin' || meta?.is_admin === true || meta?.admin === true

  const links = [
    { href: '/app', label: 'Dashboard' },
    { href: '/app/agents', label: 'Agents' },
    { href: '/app/access', label: 'Access' },
    { href: '/app/settings', label: 'Settings' },
    ...(isAdmin ? [{ href: '/app/admin', label: 'Admin' }] : []),
  ]

  return (
    <AuthGuard>
      <Nav />
      <div className="ap-shell">
        <nav className="ap-subnav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`ap-subnav-link ${pathname === link.href ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <main className="ap-main">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
