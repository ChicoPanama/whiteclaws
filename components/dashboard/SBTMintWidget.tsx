'use client';

import { useState, useCallback } from 'react';

interface SBTMintWidgetProps {
  walletAddress?: string | null;
  hasSBT?: boolean;
  isEarly?: boolean;
  mintedAt?: string | null;
}

export default function SBTMintWidget({ walletAddress, hasSBT, isEarly, mintedAt }: SBTMintWidgetProps) {
  const [minting, setMinting] = useState(false);
  const [paymentToken, setPaymentToken] = useState<'USDC' | 'ETH' | 'WC'>('USDC');
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);

  const handleMint = useCallback(async () => {
    if (!walletAddress || minting) return;
    setMinting(true);
    setResult(null);

    try {
      const res = await fetch('/api/sbt/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          payment_token: paymentToken,
        }),
      });
      const data = await res.json();
      setResult({ ok: res.ok, message: data.message || data.error });
    } catch {
      setResult({ ok: false, message: 'Network error' });
    } finally {
      setMinting(false);
    }
  }, [walletAddress, paymentToken, minting]);

  // Already minted — show status
  if (hasSBT) {
    return (
      <div className="ap-stat-card" style={{ gridColumn: '1 / -1', borderColor: isEarly ? '#8b5cf6' : 'rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="ap-stat-label">🦞 Access SBT</p>
            <p style={{ fontSize: 14, color: '#22c55e', fontWeight: 600, marginTop: 4 }}>
              ✅ Minted {isEarly && <span style={{ color: '#8b5cf6' }}>• Early Supporter ⭐</span>}
            </p>
            {mintedAt && (
              <p className="wc-field-helper">
                Since {new Date(mintedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <div style={{ fontSize: 32 }}>🦞</div>
        </div>
      </div>
    );
  }

  // Not minted — show mint CTA
  return (
    <div className="ap-stat-card" style={{ gridColumn: '1 / -1', borderColor: '#ef4444' }}>
      <p className="ap-stat-label">🦞 Access SBT Required</p>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, marginBottom: 12 }}>
        Mint your Access SBT ($20) to start earning points toward the $WC airdrop.
        {!walletAddress && ' Connect your wallet first.'}
      </p>

      {walletAddress && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(['USDC', 'ETH', 'WC'] as const).map((token) => (
              <button
                key={token}
                onClick={() => setPaymentToken(token)}
                style={{
                  padding: '6px 16px',
                  background: paymentToken === token ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: `1px solid ${paymentToken === token ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 6,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: paymentToken === token ? 600 : 400,
                }}
              >
                {token === 'WC' ? '$WC' : token}
              </button>
            ))}
          </div>

          <button
            onClick={handleMint}
            disabled={minting}
            style={{
              width: '100%',
              padding: '12px 0',
              background: minting ? 'rgba(255,255,255,0.06)' : '#ef4444',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: minting ? 'wait' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {minting ? 'Minting...' : `Mint Access SBT • $20 ${paymentToken}`}
          </button>

          {result && (
            <p style={{
              marginTop: 8,
              fontSize: 13,
              color: result.ok ? '#22c55e' : '#ef4444',
            }}>
              {result.message}
            </p>
          )}
        </>
      )}
    </div>
  );
}
