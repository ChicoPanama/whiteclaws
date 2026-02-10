'use client'

import { useEffect, useState } from 'react'
import { useWhiteClaws } from '@/lib/web3/hooks'
import { getAccessStatus, mintAccess } from '@/lib/web3/access'

export default function AccessPage() {
  const { isConnected, address, connect } = useWhiteClaws()
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready'>('idle')
  const [hasAccess, setHasAccess] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!address) return

    const check = async () => {
      setStatus('loading')
      try {
        const result = await getAccessStatus(address)
        setHasAccess(result.hasAccess)
      } catch {}
      setStatus('ready')
    }
    check()
  }, [address])

  const handleMint = async () => {
    if (!address) return
    setMessage(null)
    try {
      const result = await mintAccess(address)
      if (result.ok) {
        setHasAccess(true)
        setMessage('Access granted!')
      } else {
        setMessage(result.error || 'Mint failed')
      }
    } catch {
      setMessage('Transaction failed')
    }
  }

  return (
    <div className="ap-content">
      <div className="ap-page-header">
        <h1 className="ap-page-title">Protocol Access</h1>
        <p className="ap-page-desc">Connect your wallet to verify or mint your access token (SBT).</p>
      </div>

      <div className="ap-card">
        {!isConnected ? (
          <div className="ap-card-center">
            <p className="ap-card-text">Connect your wallet to check access status.</p>
            <button onClick={connect} className="ap-btn-primary">
              Connect Wallet
            </button>
          </div>
        ) : status === 'loading' ? (
          <div className="ap-card-center">
            <div className="ap-spinner" />
            <p className="ap-card-text">Checking access for {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          </div>
        ) : hasAccess ? (
          <div className="ap-card-center">
            <div className="ap-status-badge ap-status-active">Access Active</div>
            <p className="ap-card-text">Your wallet {address?.slice(0, 6)}...{address?.slice(-4)} has a valid access SBT.</p>
          </div>
        ) : (
          <div className="ap-card-center">
            <div className="ap-status-badge ap-status-inactive">No Access</div>
            <p className="ap-card-text">Mint an access SBT to enable protocol features.</p>
            <button onClick={handleMint} className="ap-btn-primary">
              Mint Access SBT
            </button>
          </div>
        )}
        {message && <p className="ap-message">{message}</p>}
      </div>
    </div>
  )
}
