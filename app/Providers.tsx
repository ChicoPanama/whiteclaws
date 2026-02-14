'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, mainnet, arbitrum, optimism } from 'viem/chains'
import { useState, useEffect, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { OnchainKitProvider } from '@coinbase/onchainkit'

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''

/** Catches Privy init errors so the rest of the app still renders. */
class PrivyErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PrivyErrorBoundary]', error, info)
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  }))

  // PrivyProvider must only mount in the browser — it validates the app ID
  // via a network call that fails during Vercel's SSR prerender phase.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <OnchainKitProvider
        chain={base}
        config={{
          appearance: {
            name: 'WhiteClaws',
            logo: '/lobster.png',
            mode: 'dark',
            theme: 'default',
          },
          wallet: {
            display: 'classic',
            preference: 'all',
          },
        }}
      >
        {!PRIVY_APP_ID || !mounted ? (
          children
        ) : (
          <PrivyErrorBoundary fallback={children}>
            <PrivyProvider
              appId={PRIVY_APP_ID}
              config={{
                appearance: {
                  theme: 'dark',
                  accentColor: '#89E06D',
                  logo: '/lobster.png',
                },
                loginMethods: ['email', 'wallet', 'twitter', 'github'],
                embeddedWallets: {
                  ethereum: {
                    createOnLogin: 'users-without-wallets',
                  },
                },
                defaultChain: base,
                supportedChains: [mainnet, base, arbitrum, optimism],
              }}
            >
              {children}
            </PrivyProvider>
          </PrivyErrorBoundary>
        )}
      </OnchainKitProvider>
    </QueryClientProvider>
  )
}
