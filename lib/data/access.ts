import { hasSupabaseEnv } from '@/lib/env'

export interface AccessStatus {
  address?: string | null
  hasAccess: boolean
  isValidated?: boolean
  expiry?: string | null
}

export async function getAccessStatus(address?: string | null): Promise<AccessStatus> {
  if (!address || !hasSupabaseEnv) {
    return { address, hasAccess: false, isValidated: false, expiry: null }
  }

  try {
    const response = await fetch(`/api/access/status?address=${address}`, { cache: 'no-store' })
    if (!response.ok) {
      return { address, hasAccess: false, isValidated: false, expiry: null }
    }
    return response.json()
  } catch (error) {
    return { address, hasAccess: false, isValidated: false, expiry: null }
  }
}

export async function mintAccess(address?: string | null): Promise<{ ok: boolean; message?: string }> {
  if (!address) {
    return { ok: false, message: 'Wallet address missing' }
  }

  try {
    const response = await fetch('/api/access/mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    })
    if (!response.ok) {
      return { ok: false, message: 'Failed to mint access' }
    }
    return response.json()
  } catch (error) {
    return { ok: false, message: 'Failed to mint access' }
  }
}
