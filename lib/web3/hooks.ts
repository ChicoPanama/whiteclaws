/**
 * Web3 Hooks — Privy-backed wallet connection + Supabase access checks.
 * Gracefully degrades when NEXT_PUBLIC_PRIVY_APP_ID is not set.
 */

'use client'

import { useState, useCallback } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'

// ─── Types ───
export interface WhiteClawsState {
  isConnected: boolean
  address: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  isLoading: boolean
}

export interface AccessStatusState {
  hasAccess: boolean
  isLoading: boolean
  checkAccess: (address?: string) => Promise<boolean>
}

/**
 * Wallet connection hook — uses Privy when configured.
 */
export function useWhiteClaws(): WhiteClawsState {
  const { authenticated, user, login, logout, ready } = usePrivy()
  const { wallets } = useWallets()

  const address = wallets?.[0]?.address || user?.wallet?.address || null
  const isConnected = authenticated && !!address

  const connect = useCallback(async () => {
    login()
  }, [login])

  const disconnect = useCallback(async () => {
    logout()
  }, [logout])

  return {
    isConnected,
    address,
    connect,
    disconnect,
    isLoading: !ready,
  }
}

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
        const result = data.hasAccess ?? false
        setHasAccess(result)
        setIsLoading(false)
        return result
      }
    } catch {
      // API not available — fall through
    }

    setHasAccess(true)
    setIsLoading(false)
    return true
  }, [])

  return { hasAccess, isLoading, checkAccess }
}

export function useTokenBalance(): {
  balance: string
  isLoading: boolean
  refetch: () => Promise<void>
} {
  const [balance] = useState('0')
  const [isLoading] = useState(false)

  const refetch = useCallback(async () => {
    // Phase 4B: Once wcToken is deployed, use contract reads.
  }, [])

  return { balance, isLoading, refetch }
}
