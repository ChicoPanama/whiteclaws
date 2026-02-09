'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageShell from '@/components/shell/PageShell'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
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
      <PageShell
        title="Access license"
        subtitle="Sign in to manage access licensing for your agents."
        actions={
          <Button as={Link} href="/login" variant="primary">
            Log in
          </Button>
        }
      >
        <Card>
          <div className="ui-card-title">Log in required</div>
          <div className="ui-card-subtitle">
            Sign in to manage access licensing for your agents.
          </div>
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Access license"
      subtitle="Access is provided via a non-transferable SBT license."
      actions={
        <Button as={Link} href="/app/agents" variant="outline">
          Manage agents
        </Button>
      }
    >
      <Card>
        <div className="ui-card-title">Wallet connection</div>
        <div className="ui-card-subtitle">
          Connect a wallet to check the access license status for this workspace.
        </div>
        <div className="page-filters">
          <Button onClick={connect} variant="ghost">
            {address ? 'Wallet Connected' : 'Connect Wallet'}
          </Button>
          <Input value={address ?? ''} readOnly placeholder="No wallet connected" />
        </div>
        <div className="ui-card-meta">
          <span>Status:</span>
          <strong>
            {status === 'loading' ? 'Checking...' : hasAccess ? 'Access Active ✅' : 'Not licensed'}
          </strong>
        </div>
        {!hasAccess && (
          <Button onClick={handleMint} variant="outline">
            Mint Access SBT (burn ~$20 worth of token)
          </Button>
        )}
        {message && <p className="ui-card-subtitle">{message}</p>}
      </Card>
    </PageShell>
  )
}
