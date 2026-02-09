'use client'

import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 text-white">
        <header className="border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold">WhiteClaws App</Link>
            <nav className="flex gap-4 text-sm text-gray-300">
              <Link href="/app">Dashboard</Link>
              <Link href="/app/agents">Agents</Link>
              <Link href="/app/access">Access</Link>
              <Link href="/app/settings">Settings</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-10">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
