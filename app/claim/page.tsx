'use client'

import { useState, useEffect } from 'react'
import { useWhiteClaws } from '@/lib/web3/hooks'

interface ClaimData {
  eligible: boolean
  claimed: boolean
  amount: string
  contractDeployed: boolean
  vesting: {
    total: string
    claimed: string
    remaining: string
    nextUnlock: string | null
  }
}

export default function ClaimPage() {
  const { isConnected, address } = useWhiteClaws()
  const [claimData, setClaimData] = useState<ClaimData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) return

    setLoading(true)
    fetch(`/api/claims/status?address=${address}`)
      .then((r) => r.json())
      .then((data) => {
        setClaimData(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load claim status')
        setLoading(false)
      })
  }, [address])

  return (
    <div className="pr-page">
      <div className="pr-wrap">
        <div className="ap-page-header">
          <h1 className="ap-page-title">$WC Airdrop Claim</h1>
          <p className="ap-page-sub">Season 1</p>
        </div>

        {!isConnected ? (
          <div className="pr-card" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ fontSize: 16, marginBottom: 16 }}>Connect your wallet to check claim eligibility</p>
          </div>
        ) : loading ? (
          <div className="pr-card" style={{ textAlign: 'center', padding: 40 }}>
            <p>Loading claim status...</p>
          </div>
        ) : error ? (
          <div className="pr-card" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#ef4444' }}>{error}</p>
          </div>
        ) : !claimData?.contractDeployed ? (
          <div className="pr-card" style={{ padding: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🦞</div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>Claiming Not Yet Open</h2>
              <p style={{ opacity: 0.7, maxWidth: 400, margin: '0 auto' }}>
                The $WC claim contract has not been deployed yet. Keep earning points — your contributions are being tracked and will be included in the final allocation.
              </p>
            </div>

            {/* Show current status */}
            <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="ap-stat-card">
                <p className="ap-stat-label">Wallet</p>
                <p style={{ fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>{address}</p>
              </div>
              <div className="ap-stat-card">
                <p className="ap-stat-label">Status</p>
                <p className="ap-stat-value" style={{ color: claimData?.eligible ? '#22c55e' : '#888' }}>
                  {claimData?.eligible ? 'Eligible' : 'Not Eligible'}
                </p>
              </div>
            </div>
          </div>
        ) : claimData.claimed ? (
          <div className="pr-card" style={{ padding: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>Claimed</h2>
              <p style={{ opacity: 0.7 }}>Your $WC airdrop has been claimed.</p>
            </div>

            {/* Vesting info */}
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div className="ap-stat-card">
                <p className="ap-stat-label">Total Allocated</p>
                <p className="ap-stat-value">{claimData.vesting.total}</p>
              </div>
              <div className="ap-stat-card">
                <p className="ap-stat-label">Claimed</p>
                <p className="ap-stat-value ap-stat-active">{claimData.vesting.claimed}</p>
              </div>
              <div className="ap-stat-card">
                <p className="ap-stat-label">Remaining (Vesting)</p>
                <p className="ap-stat-value">{claimData.vesting.remaining}</p>
              </div>
            </div>

            {claimData.vesting.nextUnlock && (
              <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, opacity: 0.6 }}>
                Next unlock: {new Date(claimData.vesting.nextUnlock).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <div className="pr-card" style={{ padding: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🦞</div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>Claim Available</h2>
              <p style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
                {claimData.amount} $WC
              </p>
              <button
                className="pr-cta-primary"
                style={{ fontSize: 16, padding: '12px 32px' }}
                onClick={() => {
                  // Will call claim contract when deployed
                  alert('Claim contract interaction — connect wallet and submit Merkle proof')
                }}
              >
                Claim $WC
              </button>
              <p style={{ marginTop: 12, fontSize: 12, opacity: 0.5 }}>
                Split: immediate release + linear vesting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
