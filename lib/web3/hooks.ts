/**
 * Web3 Hooks
 * Uses Privy for wallet connection when configured,
 * falls back to stub implementations otherwise.
 */

import { useState, useCallback, useEffect } from 'react'

// Types
export interface WhiteClawsState {
  isConnected: boolean
  address: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

export interface AccessStatusState {
  hasAccess: boolean
  isLoading: boolean
  checkAccess: (address?: string) => Promise<boolean>
}

/**
 * Try to use Privy hooks when available.
 * Returns null if Privy is not configured or not in context.
 */
function usePrivySafe() {
  try {
    const privy = require('@privy-io/react-auth')
    const state = privy.usePrivy?.()
    // Only return if we're inside a mounted PrivyProvider
    if (state && typeof state.ready === 'boolean') return state
    return null
  } catch {
    return null
  }
}

/**
 * Hook for WhiteClaws wallet connection
 * Uses Privy if configured, otherwise returns safe stubs
 */
export function useWhiteClaws(): WhiteClawsState {
  const privy = usePrivySafe()
  const [stubConnected, setStubConnected] = useState(false)
  const [stubAddress, setStubAddress] = useState<string | null>(null)

  // If Privy is available, derive state from it
  if (privy && privy.ready) {
    const wallet = privy.user?.wallet
    return {
      isConnected: privy.authenticated && !!wallet,
      address: wallet?.address ?? null,
      connect: async () => {
        if (!privy.authenticated) {
          privy.login?.()
        }
      },
      disconnect: async () => {
        privy.logout?.()
      },
    }
  }

  // Stub fallback
  const connect = useCallback(async () => {
    console.log('[WhiteClaws] No wallet provider configured. Set NEXT_PUBLIC_PRIVY_APP_ID.')
    setStubConnected(true)
    setStubAddress('0x' + '0'.repeat(40))
  }, [])

  const disconnect = useCallback(async () => {
    setStubConnected(false)
    setStubAddress(null)
  }, [])

  return {
    isConnected: stubConnected,
    address: stubAddress,
    connect,
    disconnect,
  }
}

/**
 * Hook for checking access token/SBT status
 * Will read from contract once deployed (Phase 4)
 */
export function useAccessStatus(): AccessStatusState {
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const checkAccess = useCallback(async (address?: string): Promise<boolean> => {
    if (!address) return false
    setIsLoading(true)

    try {
      // Try API endpoint (works if Supabase is configured)
      const res = await fetch(`/api/access/status?address=${address}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setHasAccess(data.hasAccess ?? false)
        setIsLoading(false)
        return data.hasAccess ?? false
      }
    } catch {
      // API not available — fall through
    }

    // Stub: no access
    setHasAccess(false)
    setIsLoading(false)
    return false
  }, [])

  return { hasAccess, isLoading, checkAccess }
}

/**
 * Hook for wcToken balance
 * Will read from ERC-20 contract once deployed (Phase 4)
 */
export function useTokenBalance(): {
  balance: string
  isLoading: boolean
  refetch: () => Promise<void>
} {
  const [balance, setBalance] = useState('0')
  const [isLoading, setIsLoading] = useState(false)

  const refetch = useCallback(async () => {
    // Phase 4: implement actual ERC-20 balance read via viem
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 50))
    setBalance('0')
    setIsLoading(false)
  }, [])

  return { balance, isLoading, refetch }
}
