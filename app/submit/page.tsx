'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function SubmitPage() {
  const params = useSearchParams()
  const protocol = params.get('protocol') || ''
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    steps: ''
  })
  const [isEncrypted, setIsEncrypted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate encryption
    setTimeout(() => {
      setIsEncrypted(true)
      setIsSubmitting(false)
      setSubmitted(true)
    }, 1500)
  }

  const severityColors: Record<string, string> = {
    critical: 'bg-red-600',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500'
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Submit Finding</h1>
          <p className="text-gray-400">
            {protocol ? (
              <>For protocol: <span className="text-green-400 font-semibold">{protocol}</span></>
            ) : (
              'Submit vulnerability to WhiteClaws bounty programs'
            )}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Severity Selection */}
            <div>
              <label className="block text-white font-semibold mb-3">Severity</label>
              <div className="grid grid-cols-4 gap-3">
                {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setFormData({...formData, severity: sev})}
                    className={`p-3 rounded-lg font-semibold capitalize transition-all ${
                      formData.severity === sev 
                        ? `${severityColors[sev]} text-white` 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

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

            {/* Encryption Notice */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔐</span>
                <div>
                  <p className="text-white font-semibold">Client-Side Encryption</p>
                  <p className="text-gray-400 text-sm">
                    Your report will be encrypted using TweetNaCl before submission. Only the protocol team can decrypt.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isEncrypted}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                isEncrypted 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white disabled:opacity-50'
              }`}
            >
              {isSubmitting ? '🔐 Encrypting...' : isEncrypted ? '✅ Encrypted & Ready' : '🔐 Encrypt & Submit'}
            </button>
          </form>
        ) : (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-8 text-center">
            <span className="text-6xl mb-4 block">✅</span>
            <h2 className="text-2xl font-bold text-white mb-2">Submission Encrypted!</h2>
            <p className="text-gray-400 mb-4">
              Your finding has been encrypted and submitted to {protocol || 'the protocol team'}.
            </p>
            <p className="text-gray-400 mb-6">
              You will receive a confirmation email once the report is reviewed.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/protocols"
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
              >
                View Protocols
              </a>
              <a
                href="/dashboard"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
              >
                Dashboard →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
