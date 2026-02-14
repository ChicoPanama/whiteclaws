'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, mainnet, arbitrum, optimism } from 'viem/chains'
import { useState, useEffect } from 'react'
import { OnchainKitProvider } from '@coinbase/onchainkit'

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''

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
        )}
      </OnchainKitProvider>
    </QueryClientProvider>
  )
}
