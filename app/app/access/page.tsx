'use client'

import { useEffect, useState } from 'react'
import { useWhiteClaws } from '@/lib/web3/hooks'
import { getAccessStatus, mintAccess } from '@/lib/data/access'
import { useAuth } from '@/hooks/useAuth'

export default function AccessPage() {
  const { isAuthenticated } = useAuth()
  const { address, connect } = useWhiteClaws()
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready'>('idle')
  const [hasAccess, setHasAccess] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadStatus = async () => {
      if (!address) return
      setStatus('loading')
      const result = await getAccessStatus(address)
      setHasAccess(result.hasAccess)
      setStatus('ready')
    }

    loadStatus()
  }, [address])

  const handleMint = async () => {
    setMessage(null)
    setStatus('loading')
    const response = await mintAccess(address)
    setMessage(response.message ?? (response.ok ? 'Access request submitted.' : 'Failed to mint access'))
    const refreshed = await getAccessStatus(address)
    setHasAccess(refreshed.hasAccess)
    setStatus('ready')
  }

  if (!isAuthenticated) {
    return (
      <div className="nb">
        <h2>Log in required</h2>
        <p>Sign in to manage access licensing for your agents.</p>
        <a href="/login" className="btn btn-g" style={{ marginTop: 16, display: 'inline-flex' }}>
          Log In →
        </a>
      </div>
    )
  }

  return (
    <div className="nb">
      <h3>Access License</h3>
      <p>Access is provided via a non-transferable SBT license.</p>
      <div className="nr" style={{ marginTop: 12 }}>
        <button className="nbtn" onClick={connect} type="button">
          {address ? 'Wallet Connected' : 'Connect Wallet'}
        </button>
        <span className="ni" style={{ display: 'flex', alignItems: 'center' }}>
          {address ?? 'No wallet connected'}
        </span>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong>Status:</strong>{' '}
        {status === 'loading' ? 'Checking...' : hasAccess ? 'Access Active ✅' : 'Not licensed'}
      </div>

      {!hasAccess && (
        <button className="btn btn-g" style={{ marginTop: 16 }} onClick={handleMint} type="button">
          Mint Access SBT (burn ~$20 worth of token)
        </button>
      )}

      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  )
}
