'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

interface Finding {
  id: string
  title: string
  severity: string
  status: string
  scope_version: number
  triage_notes: string | null
  triaged_at: string | null
  accepted_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
  payout_amount: number | null
  payout_currency: string | null
  payout_tx_hash: string | null
  paid_at: string | null
  duplicate_of: string | null
  poc_url: string | null
  encrypted_report: { ciphertext: string; nonce: string; sender_pubkey: string } | null
  created_at: string
  researcher?: { id: string; handle: string; display_name: string }
}

interface Comment {
  id: string
  content: string
  is_internal: boolean
  created_at: string
  user?: { id: string; handle: string; display_name: string }
}

export default function ProtocolFindingDetailPage() {
  const params = useParams()
  const findingId = params.id as string
  const [finding, setFinding] = useState<Finding | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [triaging, setTriaging] = useState(false)
  const [paying, setPaying] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [message, setMessage] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [decryptedReport, setDecryptedReport] = useState('')

  const slug = typeof window !== 'undefined' ? localStorage.getItem('wc_protocol_slug') || '' : ''

  const loadFinding = useCallback(async () => {
    try {
      const res = await fetch(`/api/findings/${findingId}/comment`, {
        // session cookie auth
      })
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch {
      // ignore
    }
  }, [findingId])

  useEffect(() => {
    if (!slug || !findingId) return
    setLoading(true)

    fetch(`/api/protocols/${slug}/findings`, {
      // session cookie auth
    })
      .then(r => r.json())
      .then(data => {
        const f = (data.findings || []).find((f: Finding) => f.id === findingId)
        if (f) setFinding(f)
      })
      .finally(() => setLoading(false))

    loadFinding()
  }, [findingId, slug, loadFinding])

  const handleTriage = async (status: string, extra: Record<string, unknown> = {}) => {
    setTriaging(true)
    setMessage('')
    try {
      const res = await fetch(`/api/findings/${findingId}/triage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(`Finding marked as ${status}`)
      if (data.finding) setFinding(prev => prev ? { ...prev, ...data.finding } : prev)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Triage failed')
    } finally {
      setTriaging(false)
    }
  }

  const handlePay = async () => {
    const txHash = prompt('Enter transaction hash:')
    const amount = prompt('Enter payout amount (USD):')
    if (!txHash || !amount) return
    setPaying(true)
    setMessage('')
    try {
      const res = await fetch(`/api/findings/${findingId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tx_hash: txHash, amount: Number(amount) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('Payment recorded')
      if (data.finding) setFinding(prev => prev ? { ...prev, ...data.finding } : prev)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  const handleComment = async () => {
    if (!commentText.trim()) return
    try {
      const res = await fetch(`/api/findings/${findingId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentText, is_internal: isInternal }),
      })
      if (res.ok) {
        setCommentText('')
        loadFinding()
      }
    } catch {
      // ignore
    }
  }

  const handleDecrypt = async () => {
    if (!finding?.encrypted_report || !privateKey) return
    try {
      const nacl = await import('tweetnacl')
      const naclUtil = await import('tweetnacl-util')
      const { ciphertext, nonce, sender_pubkey } = finding.encrypted_report
      const decrypted = nacl.box.open(
        naclUtil.decodeBase64(ciphertext),
        naclUtil.decodeBase64(nonce),
        naclUtil.decodeBase64(sender_pubkey),
        naclUtil.decodeBase64(privateKey),
      )
      if (decrypted) {
        setDecryptedReport(naclUtil.encodeUTF8(decrypted))
      } else {
        setDecryptedReport('Decryption failed — wrong key or corrupted data')
      }
    } catch {
      setDecryptedReport('Decryption error — check your private key format')
    }
  }

  if (loading) {
    return <div className="ap-content"><p>Loading...</p></div>
  }

  if (!finding) {
    return <div className="ap-content"><p>Finding not found.</p></div>
  }

  return (
    <div className="ap-content">
      <div className="ap-page-header">
        <h1 className="ap-page-title">{finding.title}</h1>
        <p className="ap-page-desc">
          {finding.severity.toUpperCase()} | {finding.status.toUpperCase()} | Scope v{finding.scope_version}
          {finding.researcher && ` | by ${finding.researcher.display_name || finding.researcher.handle}`}
        </p>
      </div>

      {message && <p style={{ color: message.includes('failed') || message.includes('error') ? '#ef4444' : '#22c55e', marginBottom: '16px' }}>{message}</p>}

      {/* Encrypted Report */}
      {finding.encrypted_report && (
        <div className="ap-card">
          <h2 className="ap-card-title">Encrypted Report</h2>
          {!decryptedReport ? (
            <>
              <div className="ap-field">
                <label className="ap-field-label">Your Private Key (Base64)</label>
                <input type="password" className="ap-field-input" value={privateKey} onChange={e => setPrivateKey(e.target.value)} placeholder="Paste your protocol private key..." />
              </div>
              <div className="ap-field-actions">
                <button onClick={handleDecrypt} className="ap-btn-primary" disabled={!privateKey}>Decrypt Report</button>
              </div>
              <p className="ap-card-text" style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>Your private key never leaves the browser.</p>
            </>
          ) : (
            <pre style={{ background: 'var(--bg-secondary, #111)', padding: '16px', borderRadius: '6px', whiteSpace: 'pre-wrap', fontSize: '13px', maxHeight: '400px', overflow: 'auto' }}>
              {decryptedReport}
            </pre>
          )}
        </div>
      )}

      {finding.poc_url && (
        <div className="ap-card">
          <h2 className="ap-card-title">Proof of Concept</h2>
          <a href={finding.poc_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-link, #3b82f6)' }}>{finding.poc_url}</a>
        </div>
      )}

      {/* Triage Actions */}
      {(finding.status === 'submitted' || finding.status === 'triaged') && (
        <div className="ap-card">
          <h2 className="ap-card-title">Triage Actions</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {finding.status === 'submitted' && (
              <button onClick={() => handleTriage('triaged', { notes: prompt('Triage notes:') || '' })} className="ap-btn-primary" disabled={triaging}>Mark Triaged</button>
            )}
            <button onClick={() => {
              const amount = prompt('Payout amount (USD):')
              handleTriage('accepted', { payout_amount: amount ? Number(amount) : undefined, notes: 'Accepted' })
            }} className="ap-btn-primary" style={{ background: '#22c55e' }} disabled={triaging}>Accept</button>
            <button onClick={() => handleTriage('rejected', { rejection_reason: prompt('Rejection reason:') || 'Does not meet criteria' })} className="ap-btn-primary" style={{ background: '#ef4444' }} disabled={triaging}>Reject</button>
            <button onClick={() => {
              const dupId = prompt('Duplicate of finding ID:')
              if (dupId) handleTriage('duplicate', { duplicate_of: dupId })
            }} className="ap-btn-primary" style={{ background: '#6b7280' }} disabled={triaging}>Duplicate</button>
          </div>
        </div>
      )}

      {/* Pay */}
      {finding.status === 'accepted' && (
        <div className="ap-card">
          <h2 className="ap-card-title">Record Payment</h2>
          <p className="ap-card-text">Payout amount: ${finding.payout_amount?.toLocaleString() || 'Not set'}</p>
          <div className="ap-field-actions">
            <button onClick={handlePay} className="ap-btn-primary" disabled={paying}>{paying ? 'Recording...' : 'Record Payout'}</button>
          </div>
        </div>
      )}

      {/* Payment Info */}
      {finding.paid_at && (
        <div className="ap-card">
          <h2 className="ap-card-title">Payment Recorded</h2>
          <p className="ap-card-text">${finding.payout_amount?.toLocaleString()} {finding.payout_currency}</p>
          {finding.payout_tx_hash && <p className="ap-card-text" style={{ fontSize: '12px', opacity: 0.7 }}>TX: {finding.payout_tx_hash}</p>}
          <p className="ap-card-text" style={{ fontSize: '12px', opacity: 0.5 }}>Paid: {new Date(finding.paid_at).toLocaleString()}</p>
        </div>
      )}

      {/* Triage Info */}
      {finding.triage_notes && (
        <div className="ap-card">
          <h2 className="ap-card-title">Triage Notes</h2>
          <p className="ap-card-text">{finding.triage_notes}</p>
        </div>
      )}

      {finding.rejection_reason && (
        <div className="ap-card">
          <h2 className="ap-card-title">Rejection Reason</h2>
          <p className="ap-card-text">{finding.rejection_reason}</p>
        </div>
      )}

      {/* Comments */}
      <div className="ap-card">
        <h2 className="ap-card-title">Comments ({comments.length})</h2>
        {comments.map(c => (
          <div key={c.id} style={{ padding: '8px', marginBottom: '8px', background: 'var(--bg-secondary, #111)', borderRadius: '6px', borderLeft: c.is_internal ? '3px solid #f59e0b' : '3px solid #3b82f6' }}>
            <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
              {c.user?.display_name || c.user?.handle || 'Unknown'} {c.is_internal && '(internal)'} — {new Date(c.created_at).toLocaleString()}
            </div>
            <p style={{ margin: 0 }}>{c.content}</p>
          </div>
        ))}

        <div style={{ marginTop: '12px' }}>
          <textarea className="ap-field-input" rows={3} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..." />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <button onClick={handleComment} className="ap-btn-primary" disabled={!commentText.trim()}>Send</button>
            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
              Internal (hidden from submitter)
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
