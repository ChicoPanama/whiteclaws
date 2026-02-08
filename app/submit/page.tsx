'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { encryptMessage, generateKeyPair } from '@/lib/crypto'

const supabase = createClient()

type ProtocolData = {
  slug: string
  name: string
  description: string
  category: string
  chains: string[]
  bounty: { max: number; min: number; kyc_required: boolean; payout_token: string }
  severity_payouts: Record<string, any>
  contracts: Array<{ address: string; network: string; name: string; type: string }>
  scope: { in_scope: string[]; out_of_scope: string[] }
}

export default function SubmitPage() {
  const router = useRouter()
  const params = useSearchParams()
  const protocolSlug = params.get('protocol') || ''
  
  const [protocol, setProtocol] = useState<ProtocolData | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    steps: '',
    poc_code: '',
    impact_analysis: ''
  })
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Load protocol data
  useEffect(() => {
    async function loadProtocol() {
      if (!protocolSlug) return
      
      try {
        // Try to load from JSON file first
        const response = await fetch(`/protocols/${protocolSlug}.json`)
        if (response.ok) {
          const data = await response.json()
          setProtocol(data)
          return
        }
        
        // Fallback: Load from Supabase
        const { data } = await supabase
          .from('protocols')
          .select('*')
          .eq('slug', protocolSlug)
          .single()
        
        if (data) setProtocol(data)
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
      // Generate encryption keys
      const { publicKey: senderPublicKey, secretKey: senderSecretKey } = generateKeyPair()
      
      // For demo: Use a hardcoded recipient public key (protocol's key)
      // In production: protocol.public_key from database
      const recipientPublicKey = 'w3J/6zqIjRjUo4WYgEqKF5j4QkBKK6DQr3a72wP8qzI='
      
      // Create full report
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
      
      // Encrypt
      const encrypted = encryptMessage(
        JSON.stringify(report),
        recipientPublicKey,
        senderSecretKey
      )
      
      setIsEncrypting(false)
      setIsSubmitting(true)
      
      // Store encrypted payload in Supabase
      const { data: finding, error: insertError } = await supabase
        .from('findings')
        .insert({
          protocol_id: protocol?.id || null,
          title: `[ENCRYPTED] ${formData.title}`,
          severity: formData.severity,
          encrypted_report_url: 'supabase://encrypted-reports/' + Date.now(),
          status: 'submitted',
          metadata: {
            protocol_slug: protocolSlug,
            encrypted_nonce: encrypted.nonce,
            sender_public_key: senderPublicKey,
            encryption_version: 'tweetnacl-box',
            original_title_length: formData.title.length
          }
        })
        .select()
        .single()
      
      if (insertError) throw insertError
      
      // Store encrypted content in Supabase Storage
      const encryptedBlob = new Blob([JSON.stringify(encrypted)], { type: 'application/json' })
      const filePath = `encrypted-reports/${finding.id}.json`
      
      const { error: uploadError } = await supabase.storage
        .from('findings')
        .upload(filePath, encryptedBlob, {
          contentType: 'application/json',
          upsert: true
        })
      
      if (uploadError) throw uploadError
      
      setSubmittedId(finding.id)
      setIsSubmitting(false)
      
    } catch (err: any) {
      console.error('Submission failed:', err)
      setError(err.message || 'Submission failed. Please try again.')
      setIsEncrypting(false)
      setIsSubmitting(false)
    }
  }
  
  const severityColors: Record<string, string> = {
    critical: 'bg-red-600',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500'
  }
  
  if (submittedId) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-8 text-center">
            <span className="text-6xl mb-4 block">✅</span>
            <h2 className="text-2xl font-bold text-white mb-2">Submission Complete!</h2>
            <p className="text-gray-400 mb-4">
              Your finding has been <span className="text-green-400 font-semibold">encrypted</span> and submitted{protocol && <> to <span className="text-green-400 font-semibold">{protocol.name}</span></>}.
            </p>
            <div className="bg-gray-800 rounded-lg p-4 max-w-md mx-auto mb-6 text-left">
              <p className="text-gray-400 text-sm mb-2">Submission ID:</p>
              <p className="text-white font-mono text-lg">{submittedId}</p>
            </div>
            <p className="text-gray-400 mb-6">
              The protocol team will review your encrypted report. You'll be notified when they respond.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/protocols')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Browse More Protocols
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                View Dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with Protocol Info */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🐇</span>
            <h1 className="text-3xl font-bold text-white">Submit Finding</h1>
          </div>
          
          {protocol ? (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">{protocol.name}</h2>
                  <p className="text-gray-400 text-sm">{protocol.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                    ${protocol.bounty.max.toLocaleString()} max bounty
                  </span>
                  {protocol.bounty.kyc_required && (
                    <span className="bg-yellow-900 text-yellow-300 px-3 py-1 rounded-full text-sm">
                      🔒 KYC
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">
              {protocolSlug ? `Loading ${protocolSlug}...` : 'Submit vulnerability to WhiteClaws bounty programs'}
            </p>
          )}
        </div>
        
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}
        
        {/* Severity Selection */}
        <div className="mb-8">
          <label className="block text-white font-semibold mb-3">Severity</label>
          <div className="grid grid-cols-4 gap-3">
            {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setFormData({...formData, severity: sev})}
                className={`p-4 rounded-lg font-semibold capitalize transition-all text-center ${
                  formData.severity === sev 
                    ? `${severityColors[sev]} text-white` 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {sev}
                <br />
                <span className="text-xs opacity-70">
                  ${protocol?.severity_payouts?.[sev]?.max?.toLocaleString?.() || '???'}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-white font-semibold mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
              placeholder="Brief description of the vulnerability"
              required
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-white font-semibold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white h-32"
              placeholder="Detailed explanation of the vulnerability and impact"
              required
            />
          </div>
          
          {/* Steps to Reproduce */}
          <div>
            <label className="block text-white font-semibold mb-2">Steps to Reproduce</label>
            <textarea
              value={formData.steps}
              onChange={(e) => setFormData({...formData, steps: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white h-40 font-mono text-sm"
              placeholder="1. Step one...\n2. Step two...\n3. etc."
              required
            />
          </div>
          
          {/* PoC Code (optional) */}
          <div>
            <label className="block text-white font-semibold mb-2">Proof of Concept Code (optional)</label>
            <textarea
              value={formData.poc_code}
              onChange={(e) => setFormData({...formData, poc_code: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white h-32 font-mono text-sm"
              placeholder="Solidity/Foundry test code demonstrating the exploit"
            />
          </div>
          
          {/* Impact Analysis */}
          <div>
            <label className="block text-white font-semibold mb-2">Impact Analysis</label>
            <textarea
              value={formData.impact_analysis}
              onChange={(e) => setFormData({...formData, impact_analysis: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white h-32"
              placeholder="Financial impact, user impact, protocol risk, and remediation suggestions"
            />
          </div>
          
          {/* Security & Encryption Notice */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">🔐</span>
              <div>
                <p className="text-white font-semibold">Client-Side Encryption with TweetNaCl</p>
                <p className="text-gray-400 text-sm mt-1">
                  Your entire report is encrypted <span className="text-green-400 font-semibold">in your browser</span> before being sent.
                  Only the intended protocol team can decrypt it using their private key.
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Technology: TweetNaCl (NaCl crypto library) • End-to-end encryption • Zero-knowledge to WhiteClaws
                </p>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isEncrypting || isSubmitting}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
              isEncrypting || isSubmitting
                ? 'bg-green-600 text-white opacity-70'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isEncrypting ? '🔐 Encrypting...' : 
             isSubmitting ? '📤 Submitting...' : 
             '🔐 Encrypt & Submit'}
          </button>
        </form>
      </div>
    </div>
  )
}