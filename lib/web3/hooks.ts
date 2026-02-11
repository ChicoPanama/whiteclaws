/**
 * Web3 Hooks
 * Clean stub implementations. Will be upgraded to use Privy/wagmi
 * once NEXT_PUBLIC_PRIVY_APP_ID is configured (Phase 4).
 */

import { useState, useCallback } from 'react'

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
 * Hook for wallet connection.
 * Phase 4 will replace with Privy wallet hooks.
 */
export function useWhiteClaws(): WhiteClawsState {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)

  const connect = useCallback(async () => {
    // Stub: simulates connection
    setIsConnected(true)
    setAddress('0x' + '0'.repeat(40))
  }, [])

  const disconnect = useCallback(async () => {
    setIsConnected(false)
    setAddress(null)
  }, [])

  return { isConnected, address, connect, disconnect }
}

/**
 * Hook for checking access token/SBT status.
 * Phase 4 will replace with on-chain contract read.
 */
export function useAccessStatus(): AccessStatusState {
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const checkAccess = useCallback(async (address?: string): Promise<boolean> => {
    if (!address) return false
    setIsLoading(true)

    try {
      const res = await fetch(`/api/access/status?address=${address}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setHasAccess(data.hasAccess ?? false)
        setIsLoading(false)
        return data.hasAccess ?? false
      }
    } catch {
      // API not available
    }

    setHasAccess(false)
    setIsLoading(false)
    return false
  }, [])

  return { hasAccess, isLoading, checkAccess }
}

/**
 * Hook for wcToken balance.
 * Phase 4 will replace with ERC-20 read via viem.
 */
export function useTokenBalance(): {
  balance: string
  isLoading: boolean
  refetch: () => Promise<void>
} {
  const [balance, setBalance] = useState('0')
  const [isLoading, setIsLoading] = useState(false)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 50))
    setBalance('0')
    setIsLoading(false)
  }, [])

  return { balance, isLoading, refetch }
}
