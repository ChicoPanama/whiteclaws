import type { AccessMintResponse, AccessStatus } from './types'

export async function getAccessStatus(address: string): Promise<AccessStatus> {
  const response = await fetch(`/api/access/status?address=${address}`, { cache: 'no-store' })
  if (!response.ok) {
    return { address, hasAccess: false, isValidated: false, expiry: null }
  }
  return response.json()
}

export async function mintAccess(address: string): Promise<AccessMintResponse> {
  const response = await fetch('/api/access/mint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  })

  if (!response.ok) {
    return { ok: false, error: 'Failed to mint access' }
  }

  return response.json()
}
