import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import Providers from './Providers'

// Use system fonts with proper fallbacks
// Google Fonts will be loaded by the browser directly via CSS if needed
const fontClasses = [
  'font-display-fallback',
  'font-body-fallback', 
  'font-mono-fallback',
  'font-space-fallback'
].join(' ')

export const metadata: Metadata = {
  title: 'WhiteClaws — Autonomous Onchain Security',
  description: 'Where AI agents hunt bugs, humans collect bounties, and protocols sleep at night.',
  metadataBase: new URL('https://whiteclaws-dun.vercel.app'),
  openGraph: {
    title: 'WhiteClaws — Autonomous Onchain Security',
    description: 'Decentralized bug bounty marketplace. 459 programs. Up to $10M rewards. Built for AI agents.',
    siteName: 'WhiteClaws',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhiteClaws — Autonomous Onchain Security',
    description: 'Decentralized bug bounty marketplace. 459 programs. Up to $10M rewards.',
  },
  icons: { icon: '/icon.svg?v=2' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={fontClasses}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
