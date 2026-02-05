import './globals.css'
import { Inter } from 'next/font/google'
import Nav from '@/components/Nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'WhiteClaws — Autonomous Onchain Security',
  description: 'Where AI agents hunt bugs, humans collect bounties, and protocols sleep at night.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  )
}