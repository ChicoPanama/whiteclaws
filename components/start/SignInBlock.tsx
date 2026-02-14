'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { useAccount, useDisconnect, useSignMessage } from 'wagmi'

interface SignInBlockProps {
  /** Where to redirect after successful sign-in */
  callbackUrl?: string
  /** Persona label shown above the form */
  persona: 'researcher' | 'agent' | 'protocol'
}

export default function SignInBlock({ callbackUrl, persona }: SignInBlockProps) {
  const router = useRouter()
  const { signIn, signInWithOAuth, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [walletBusy, setWalletBusy] = useState(false)

  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()

  const destination = callbackUrl || '/dashboard'

  const handleWalletLogin = async () => {
    setError('')
    if (!address || !isConnected) {
      setError('Connect your wallet first.')
      return
    }
    setWalletBusy(true)
    try {
      const challengeRes = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      const challenge = await challengeRes.json().catch(() => ({}))
      if (!challengeRes.ok) throw new Error(challenge?.error || 'Failed to create challenge')

      const signature = await signMessageAsync({ message: challenge.message })

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: challenge.message, signature }),
      })
      const verified = await verifyRes.json().catch(() => ({}))
      if (!verifyRes.ok) throw new Error(verified?.error || 'Wallet verification failed')

      localStorage.removeItem('wc_agent_api_key')
      router.push(destination)
    } catch (e: unknown) {
      const err = e as Error
      setError(err?.message || 'Wallet login failed')
    } finally {
      setWalletBusy(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const result = await signIn(email, password)
    if (result.success) {
      router.push(destination)
    } else {
      setError('Invalid email or password')
    }
  }

  const handleOAuth = async (provider: 'twitter' | 'github') => {
    setError('')
    const result = await signInWithOAuth(provider)
    if (!result.success) setError(`Failed to connect with ${provider}`)
  }

  return (
    <div className="si-block">
      {error && (
        <div className="si-error">
          <p>{error}</p>
        </div>
      )}

      {/* Wallet — primary */}
      <div className="si-section">
        <ConnectWallet className="lg-wallet-btn" text="Connect Wallet" />

        {isConnected && address && (
          <div className="si-wallet-info">
            <div className="si-wallet-row">
              <div>
                <div className="si-wallet-label">Connected</div>
                <code className="si-wallet-addr">{address.slice(0, 6)}...{address.slice(-4)}</code>
              </div>
              <button onClick={() => disconnect()} className="si-btn-ghost">
                Disconnect
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleWalletLogin}
          disabled={!isConnected || walletBusy}
          className="si-btn-primary"
          style={{ opacity: !isConnected ? 0.5 : 1 }}
        >
          {walletBusy ? 'Signing in...' : 'Sign in with Wallet →'}
        </button>

        {persona !== 'agent' && (
          <p className="si-helper">
            No wallet yet? Click &ldquo;Connect Wallet&rdquo; above — you can create one instantly.
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="si-divider"><span>or continue with</span></div>

      {/* OAuth */}
      <div className="si-oauth">
        <button onClick={() => handleOAuth('twitter')} disabled={loading} className="si-oauth-btn">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Twitter / X
        </button>
        <button onClick={() => handleOAuth('github')} disabled={loading} className="si-oauth-btn">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </button>
      </div>

      {/* Email fallback */}
      <div className="si-divider"><span>or with email</span></div>

      <form onSubmit={handleEmailLogin} className="si-email-form">
        <div className="si-field">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="si-input"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="si-field">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="si-input"
            placeholder="Password"
            required
          />
        </div>
        <button type="submit" disabled={loading} className="si-btn-secondary">
          {loading ? 'Signing in...' : 'Sign In →'}
        </button>
      </form>

      <p className="si-footer">
        Don&apos;t have an account? Signing in creates one automatically.
        <br />
        <Link href="/login" className="si-link">Use the full login page instead →</Link>
      </p>
    </div>
  )
}
