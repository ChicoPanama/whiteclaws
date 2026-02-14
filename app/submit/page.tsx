'use client'

import { useState, useEffect } from 'react'
import type { Row } from '@/lib/supabase/helpers'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { encryptMessage, generateKeyPair } from '@/lib/crypto'
import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import ProtocolIcon from '@/components/ProtocolIcon'

export const dynamic = 'force-dynamic';

let supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    supabase = createClient();
  }
  return supabase;
}

type ProtocolData = {
  id?: string
  slug: string
  name: string
  description: string
  category: string
  chains: string[]
  logo_url?: string
  branding?: { primary: string; accent: string; text_on_primary: string }
  bounty: { max: number; min: number; kyc_required: boolean; payout_token: string }
  severity_payouts: Record<string, any>
  contracts: Array<{ address: string; network: string; name: string; type: string }>
  scope: { in_scope: string[]; out_of_scope: string[] }
}

const SEV_CONFIG = {
  critical: { label: 'Critical', dot: '#FF4747', bg: 'rgba(255,71,71,0.06)', border: 'rgba(255,71,71,0.2)', activeBg: 'rgba(255,71,71,0.15)' },
  high:     { label: 'High',     dot: '#FF8C42', bg: 'rgba(255,140,66,0.06)', border: 'rgba(255,140,66,0.2)', activeBg: 'rgba(255,140,66,0.15)' },
  medium:   { label: 'Medium',   dot: '#FFD166', bg: 'rgba(255,209,102,0.06)', border: 'rgba(255,209,102,0.2)', activeBg: 'rgba(255,209,102,0.15)' },
  low:      { label: 'Low',      dot: '#60A5FA', bg: 'rgba(96,165,250,0.06)', border: 'rgba(96,165,250,0.2)', activeBg: 'rgba(96,165,250,0.15)' },
} as const

type Severity = keyof typeof SEV_CONFIG

export default function SubmitPage() {
  const router = useRouter()
  const [protocolSlug, setProtocolSlug] = useState('')

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    setProtocolSlug(searchParams.get('protocol') || '')
  }, [])

  const [protocol, setProtocol] = useState<ProtocolData | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium' as Severity,
    steps: '',
    poc_code: '',
    impact_analysis: ''
  })
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProtocol() {
      if (!protocolSlug) return
      try {
        const response = await fetch(`/protocols/${protocolSlug}.json`)
        if (response.ok) {
          const data = await response.json()
          setProtocol(data)
          return
        }
        const supa = getSupabase(); if (!supa) return;
        const { data } = await supa.from('protocols').select('*').eq('slug', protocolSlug).returns<Row<'protocols'>[]>().single()
        if (data) setProtocol(data as unknown as ProtocolData)
      } catch (err) {
        console.error('Failed to load protocol:', err)
      }
    }
    loadProtocol()
  }, [protocolSlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsEncrypting(true)

    try {
      const { publicKey: senderPublicKey, secretKey: senderSecretKey } = generateKeyPair()

      // Fetch protocol's encryption public key from bounty details
      let recipientPublicKey = ''
      try {
        const bountyRes = await fetch(`/api/bounties/${protocolSlug}`)
        if (bountyRes.ok) {
          const bountyData = await bountyRes.json()
          recipientPublicKey = bountyData.program?.encryption_public_key || ''
        }
      } catch {
        // fallback below
      }
      if (!recipientPublicKey) {
        // Fallback: try protocol's public_key field
        const supa = getSupabase()
        if (supa) {
          const { data: proto } = await supa.from('protocols').select('public_key').eq('slug', protocolSlug).returns<Row<'protocols'>[]>().maybeSingle()
          recipientPublicKey = proto?.public_key || ''
        }
      }
      if (!recipientPublicKey) {
        throw new Error('This protocol has no encryption key configured. Cannot submit encrypted report.')
      }

      // Require an authenticated session. Submissions are routed through the server
      // handler (/api/findings) which enforces session auth + RLS-safe writes.
      const supa2 = getSupabase();
      if (!supa2) throw new Error("Supabase not configured");
      const { data: { user: authUser } } = await supa2.auth.getUser()
      if (!authUser) {
        throw new Error('You must be signed in to submit a finding.')
      }

      const report = {
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        steps: formData.steps,
        poc_code: formData.poc_code,
        impact_analysis: formData.impact_analysis,
        protocol_slug: protocolSlug,
        protocol_name: protocol?.name || 'Unknown',
        submitted_at: new Date().toISOString(),
        researcher: 'Anonymous'
      }

      const encrypted = encryptMessage(
        JSON.stringify(report),
        recipientPublicKey,
        senderSecretKey
      )

      setIsEncrypting(false)
      setIsSubmitting(true)

      const res = await fetch('/api/agents/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol_slug: protocolSlug,
          title: `[ENCRYPTED] ${formData.title}`,
          severity: formData.severity,
          description: formData.description,
          encrypted_report: {
            ciphertext: encrypted.ciphertext,
            nonce: encrypted.nonce,
            sender_pubkey: senderPublicKey,
          },
        }),
      })

      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed. Please try again.')
      }

      setSubmittedId(data.finding?.id || data.findingId || null)
      setIsSubmitting(false)
    } catch (err: any) {
      console.error('Submission failed:', err)
      setError(err.message || 'Submission failed. Please try again.')
      setIsEncrypting(false)
      setIsSubmitting(false)
    }
  }

  /* ─── SUCCESS STATE ─── */
  if (submittedId) {
    return (
      <>
        <Nav />
        <div className="sf-page">
          <div className="sf-wrap">
            <div className="sf-success">
              <div className="sf-success-icon">✓</div>
              <h2 className="sf-success-title">Submission Encrypted</h2>
              <p className="sf-success-desc">
                Your finding has been encrypted and submitted
                {protocol && <> to <strong>{protocol.name}</strong></>}.
              </p>
              <div className="sf-success-id">
                <span className="sf-success-id-label">Submission ID</span>
                <code className="sf-success-id-value">{submittedId}</code>
              </div>
              <p className="sf-success-note">
                The protocol team will review your encrypted report.
              </p>
              <div className="sf-success-actions">
                <button onClick={() => router.push('/bounties')} className="sf-btn-secondary">
                  Browse Bounties
                </button>
                <button onClick={() => router.push('/dashboard')} className="sf-btn-primary">
                  View Dashboard →
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  /* ─── FORM STATE ─── */
  const activeSev = SEV_CONFIG[formData.severity]

  return (
    <>
      <Nav />
      <div className="sf-page">
        <div className="sf-wrap">

          <a href="/bounties" className="sf-back">← All Bounties</a>

          {/* Header */}
          <div className="sf-header">
            <h1 className="sf-title">Submit Finding</h1>
            <p className="sf-subtitle">Encrypted vulnerability report</p>
          </div>

          {/* Protocol card */}
          {protocol ? (
            <div className="sf-protocol">
              <div className="sf-protocol-left">
                <ProtocolIcon name={protocol.name} logo_url={protocol.logo_url} size={40} />
                <div>
                  <h2 className="sf-protocol-name">{protocol.name}</h2>
                  <p className="sf-protocol-desc">{protocol.description}</p>
                </div>
              </div>
              <div className="sf-protocol-right">
                <span className="sf-protocol-bounty">
                  ${protocol.bounty.max.toLocaleString()} max
                </span>
                {protocol.bounty.kyc_required && (
                  <span className="sf-protocol-kyc">KYC</span>
                )}
              </div>
            </div>
          ) : protocolSlug ? (
            <div className="sf-protocol sf-protocol-loading">
              <span className="sf-protocol-name">Loading {protocolSlug}...</span>
            </div>
          ) : null}

          {error && (
            <div className="sf-error">
              <span className="sf-error-icon">!</span>
              <p>{error}</p>
            </div>
          )}

          {/* Severity selector */}
          <div className="sf-field">
            <label className="sf-label">
              <span className="sf-label-num">01</span>
              Severity
            </label>
            <div className="sf-sev-grid">
              {(Object.keys(SEV_CONFIG) as Severity[]).map((sev) => {
                const c = SEV_CONFIG[sev]
                const isActive = formData.severity === sev
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setFormData({ ...formData, severity: sev })}
                    className={`sf-sev-btn ${isActive ? 'active' : ''}`}
                    style={{
                      background: isActive ? c.activeBg : c.bg,
                      borderColor: isActive ? c.dot : c.border,
                      color: isActive ? c.dot : 'var(--muted)',
                    }}
                  >
                    <span className="sf-sev-dot" style={{ background: c.dot, opacity: isActive ? 1 : 0.4 }} />
                    <span className="sf-sev-name">{c.label}</span>
                    <span className="sf-sev-amount">
                      ${protocol?.severity_payouts?.[sev]?.max?.toLocaleString?.() || '—'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="sf-field">
              <label className="sf-label">
                <span className="sf-label-num">02</span>
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="sf-input"
                placeholder="Brief description of the vulnerability"
                required
              />
            </div>

            {/* Description */}
            <div className="sf-field">
              <label className="sf-label">
                <span className="sf-label-num">03</span>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="sf-textarea"
                rows={5}
                placeholder="Detailed explanation of the vulnerability and impact"
                required
              />
            </div>

            {/* Steps to Reproduce */}
            <div className="sf-field">
              <label className="sf-label">
                <span className="sf-label-num">04</span>
                Steps to Reproduce
              </label>
              <textarea
                value={formData.steps}
                onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                className="sf-textarea sf-textarea-mono"
                rows={6}
                placeholder={"1. Deploy contract with...\n2. Call function...\n3. Observe that..."}
                required
              />
            </div>

            {/* PoC Code */}
            <div className="sf-field">
              <label className="sf-label">
                <span className="sf-label-num">05</span>
                Proof of Concept
                <span className="sf-label-opt">optional</span>
              </label>
              <textarea
                value={formData.poc_code}
                onChange={(e) => setFormData({ ...formData, poc_code: e.target.value })}
                className="sf-textarea sf-textarea-mono"
                rows={5}
                placeholder="Solidity / Foundry test code demonstrating the exploit"
              />
            </div>

            {/* Impact Analysis */}
            <div className="sf-field">
              <label className="sf-label">
                <span className="sf-label-num">06</span>
                Impact Analysis
              </label>
              <textarea
                value={formData.impact_analysis}
                onChange={(e) => setFormData({ ...formData, impact_analysis: e.target.value })}
                className="sf-textarea"
                rows={4}
                placeholder="Financial impact, user risk, protocol exposure, and remediation suggestions"
              />
            </div>

            {/* Encryption notice */}
            <div className="sf-encrypt-notice">
              <div className="sf-encrypt-icon">⛓</div>
              <div>
                <p className="sf-encrypt-title">End-to-End Encrypted</p>
                <p className="sf-encrypt-desc">
                  Your report is encrypted in-browser with TweetNaCl before transmission.
                  Only the protocol team's private key can decrypt it. Zero knowledge to WhiteClaws.
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isEncrypting || isSubmitting}
              className="sf-submit"
            >
              {isEncrypting ? 'Encrypting...' :
                isSubmitting ? 'Submitting...' :
                  'Encrypt & Submit →'}
            </button>
          </form>

        </div>
      </div>
      <Footer />
    </>
  )
}
