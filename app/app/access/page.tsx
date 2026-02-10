'use client'

import { useEffect, useState } from 'react'
import { useWhiteClaws } from '@/lib/web3/hooks'
import { getAccessStatus, mintAccess } from '@/lib/web3/access'
import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'

export default function AccessPage() {
  const { isConnected, address, connect } = useWhiteClaws()
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready'>('idle')
  const [hasAccess, setHasAccess] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!address) return

    const fetchStatus = async () => {
      setStatus('loading')
      const result = await getAccessStatus(address)
      setHasAccess(result.hasAccess)
      setStatus('ready')
    }

    fetchStatus()
  }, [address])

  const handleMint = async () => {
    if (!address) return
    setMessage(null)
    setStatus('loading')
    const response = await mintAccess(address)
    if (response.ok) {
      setMessage('Access request submitted successfully.')
    } else {
      setMessage(response.error ?? 'Failed to submit access request.')
    }
    const refreshed = await getAccessStatus(address)
    setHasAccess(refreshed.hasAccess)
    setStatus('ready')
  }

  return (
    <>
      <Nav />
      <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Access License</h1>
        <p className="text-gray-400 mt-2">Access is provided via a non-transferable SBT license.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Wallet</p>
            <p className="font-mono text-sm">{address ?? 'Not connected'}</p>
          </div>
          <button
            className="bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg text-sm"
            onClick={connect}
          >
            {isConnected ? 'Connected' : 'Connect Wallet'}
          </button>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Status</p>
          <p className="text-lg font-semibold mt-1">
            {status === 'loading' ? 'Checking...' : hasAccess ? 'Access Active ✅' : 'Not licensed'}
          </p>
        </div>

        {!hasAccess && (
          <button
            className="bg-green-500 text-black px-4 py-2 rounded-lg text-sm font-semibold"
            onClick={handleMint}
            disabled={!address || status === 'loading'}
          >
            Mint Access SBT (burn ~$20 worth of token)
          </button>
        )}

        {message && <p className="text-sm text-gray-300">{message}</p>}
      </div>
    </div>
      <Footer />
    </>
  )
}
