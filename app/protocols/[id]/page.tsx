import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
const hasSupabaseConfig = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getProtocol(slug: string) {
  if (!hasSupabaseConfig) {
    // Fallback to static JSON
    const protocol = await import(`@/public/protocols/${slug}.json`).catch(() => null)
    return protocol?.default || null
  }
  
  const supabase = createClient()
  const { data } = await supabase
    .from('protocols')
    .select('*')
    .eq('slug', slug)
    .single()
  
  return data
}

export default async function ProtocolPage({ params }: { params: { id: string } }) {
  const protocol = await getProtocol(params.id)
  
  if (!protocol) {
    notFound()
  }
  
  const bounty = protocol.bounty || { max: 0, min: 0, kyc_required: false }
  const severity = protocol.severity_payouts || {}

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🎯</span>
            <h1 className="text-4xl font-bold text-white">{protocol.name}</h1>
          </div>
          <p className="text-xl text-gray-400">{protocol.description}</p>
        </div>

        {/* Bounty Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💰</span>
            <h2 className="text-2xl font-semibold text-white">Bounty Rewards</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Maximum Bounty</p>
              <p className="text-3xl font-bold text-green-400">${bounty.max?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Minimum Bounty</p>
              <p className="text-3xl font-bold text-blue-400">${bounty.min?.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {protocol.chains?.map((chain: string) => (
              <span key={chain} className="bg-blue-900 text-blue-300 px-3 py-1 rounded-full text-sm">
                {chain}
              </span>
            ))}
            <span className="bg-purple-900 text-purple-300 px-3 py-1 rounded-full text-sm">
              {protocol.category}
            </span>
            {bounty.kyc_required && (
              <span className="bg-yellow-900 text-yellow-300 px-3 py-1 rounded-full text-sm">
                🔒 KYC Required
              </span>
            )}
          </div>
        </div>

        {/* Severity Payouts */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🎚️</span>
            <h2 className="text-2xl font-semibold text-white">Severity Payouts</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(severity).map(([level, data]: [string, any]) => (
              <div key={level} className={`rounded-lg p-4 border ${
                level === 'critical' ? 'bg-red-900/20 border-red-700' :
                level === 'high' ? 'bg-orange-900/20 border-orange-700' :
                level === 'medium' ? 'bg-yellow-900/20 border-yellow-700' :
                'bg-blue-900/20 border-blue-700'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl font-semibold text-white capitalize">{level}</span>
                  <span className="text-lg font-bold text-green-400">
                    ${data.max?.toLocaleString?.() || data.max}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-2">{data.description}</p>
                <p className="text-gray-500 text-xs">Min: ${data.min?.toLocaleString?.() || data.min}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <a 
            href={`/submit?protocol=${protocol.slug}`}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Submit Finding →
          </a>
          <a 
            href={`https://immunefi.com/bug-bounty/${protocol.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            View on Immunefi ↗
          </a>
          <a 
            href={`/audits/${protocol.slug}`}
            className="bg-blue-700 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            📄 Audit Report
          </a>
        </div>
      </div>
    </div>
  )
}
