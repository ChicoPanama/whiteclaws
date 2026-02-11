'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Privy login hook — gracefully no-ops if PrivyProvider not mounted
function usePrivyLogin() {
  try {
    // Dynamic import pattern — won't break if Privy isn't configured
    const privy = require('@privy-io/react-auth');
    return privy.useLogin?.() ?? null;
  } catch {
    return null;
  }
}

function usePrivyState() {
  try {
    const privy = require('@privy-io/react-auth');
    return privy.usePrivy?.() ?? { authenticated: false, ready: false };
  } catch {
    return { authenticated: false, ready: false };
  }
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const { signIn, signInWithOAuth, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const privyLogin = usePrivyLogin();
  const privyState = usePrivyState();
  const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  const handleWalletLogin = useCallback(() => {
    if (privyLogin?.login) {
      privyLogin.login();
    } else {
      setError('Wallet connection not configured yet');
    }
  }, [privyLogin]);

  // Redirect on Privy auth
  if (privyState.authenticated) {
    router.push(callbackUrl);
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await signIn(email, password);
    if (result.success) {
      router.push(callbackUrl);
    } else {
      setError('Invalid email or password');
    }
  };

  const handleTwitterLogin = async () => {
    setError('');
    const result = await signInWithOAuth('twitter');
    if (!result.success) setError('Failed to connect with Twitter');
  };

  const handleGithubLogin = async () => {
    setError('');
    const result = await signInWithOAuth('github');
    if (!result.success) setError('Failed to connect with GitHub');
  };

  return (
    <div className="lg-page">
      <div className="lg-wrap">
        <div className="lg-header">
          <h2 className="lg-title">Sign in to WhiteClaws</h2>
          <p className="lg-subtitle">Connect your wallet or sign in with social accounts</p>
        </div>

        {error && (
          <div className="lg-error">
            <p>{error}</p>
          </div>
        )}

        {/* Wallet Connect — Primary CTA */}
        <button onClick={handleWalletLogin} className="lg-wallet-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2"/>
            <path d="M22 10H2"/>
            <circle cx="18" cy="14" r="1"/>
          </svg>
          Connect Wallet
        </button>

        <div className="lg-divider">
          <span>Or sign in with</span>
        </div>

        <div className="lg-oauth">
          <button onClick={handleTwitterLogin} disabled={loading} className="lg-oauth-btn">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Continue with Twitter
          </button>
          <button onClick={handleGithubLogin} disabled={loading} className="lg-oauth-btn">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div className="lg-divider">
          <span>Or continue with email</span>
        </div>

        <form onSubmit={handleEmailLogin}>
          <div className="lg-fields">
            <div className="sf-field">
              <label className="sf-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sf-input"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="sf-field">
              <label className="sf-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="sf-input"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="lg-options">
            <label className="lg-checkbox">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <Link href="/forgot-password" className="lg-link">Forgot password?</Link>
          </div>

          <button type="submit" disabled={loading} className="sf-submit">
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p className="lg-footer">
          Don&apos;t have an account? <Link href="/signup" className="lg-link">Sign up</Link>
        </p>
        <p className="lg-footer-sub">
          Are you a bounty program? <Link href="/app/access" className="lg-link">Apply here</Link>
        </p>
      </div>
    </div>
  );
}
