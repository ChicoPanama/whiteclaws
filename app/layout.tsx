import type { Metadata } from 'next'
import { Syne, Instrument_Sans, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import Providers from './Providers'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
})

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
  icons: { icon: '/icon.svg' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${instrumentSans.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}>
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
