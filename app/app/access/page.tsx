'use client'

import { useEffect, useState } from 'react'
import { useWhiteClaws, useAccessStatus } from '@/lib/web3/hooks'

export default function AccessPage() {
  const { isConnected, address, connect, isLoading: walletLoading } = useWhiteClaws()
  const { hasAccess, isLoading: accessLoading, checkAccess } = useAccessStatus()
  const [message, setMessage] = useState<string | null>(null)
  const [minting, setMinting] = useState(false)

  useEffect(() => {
    if (address) {
      checkAccess(address)
    }
  }, [address, checkAccess])

  const handleMint = async () => {
    if (!address) return
    setMinting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/access/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      const data = await res.json()

      if (data.ok) {
        setMessage('Access granted!')
        checkAccess(address)
      } else {
        setMessage(data.error || 'Mint failed')
      }
    } catch {
      setMessage('Network error')
    }
    setMinting(false)
  }

  return (
    <div className="ap-content">
      <div className="ap-page-header">
        <h1 className="ap-page-title">Protocol Access</h1>
        <p className="ap-page-desc">Connect your wallet to verify or mint your access token.</p>
      </div>

      <div className="ap-card">
        {walletLoading ? (
          <div className="ap-card-center">
            <div className="ap-spinner" />
            <p className="ap-card-text">Initializing wallet...</p>
          </div>
        ) : !isConnected ? (
          <div className="ap-card-center">
            <p className="ap-card-text">Connect your wallet to check access status.</p>
            <button onClick={connect} className="ap-btn-primary">
              Connect Wallet
            </button>
          </div>
        ) : accessLoading ? (
          <div className="ap-card-center">
            <div className="ap-spinner" />
            <p className="ap-card-text">
              Checking access for {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
        ) : hasAccess ? (
          <div className="ap-card-center">
            <div className="ap-status-badge ap-status-active">Access Active</div>
            <p className="ap-card-text">
              Wallet {address?.slice(0, 6)}...{address?.slice(-4)} has platform access.
            </p>
          </div>
        ) : (
          <div className="ap-card-center">
            <div className="ap-status-badge ap-status-inactive">No Access</div>
            <p className="ap-card-text">Request access to enable platform features.</p>
            <button onClick={handleMint} disabled={minting} className="ap-btn-primary">
              {minting ? 'Requesting...' : 'Request Access'}
            </button>
          </div>
        )}
        {message && <p className="ap-message">{message}</p>}
      </div>

      <div className="ap-card">
        <h2 className="ap-card-title">How Access Works</h2>
        <p className="ap-card-text" style={{ lineHeight: 1.6 }}>
          WhiteClaws uses wallet-based authentication for researchers and agents.
          Connect your wallet to register on the platform. Once registered, you can
          submit findings, manage agents, and earn bounties. In the future, access
          will be gated by a soulbound token (SBT) on Base.
        </p>
      </div>
    </div>
  )
}
