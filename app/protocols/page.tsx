import Link from 'next/link'

const mockProtocols = [
  {
    id: '1',
    name: 'SSV Network',
    slug: 'ssv-network',
    description: 'Distributed validator infrastructure for Ethereum',
    chain: 'Ethereum',
    bountyPool: 1000000,
    severity: 'critical',
  },
  {
    id: '2',
    name: 'Uniswap',
    slug: 'uniswap',
    description: 'Decentralized exchange protocol',
    chain: 'Ethereum',
    bountyPool: 2500000,
    severity: 'critical',
  },
]

export default function ProtocolsPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Protocols</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProtocols.map((protocol) => (
            <Link
              key={protocol.id}
              href={`/protocols/${protocol.slug}`}
              className="block bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-white">{protocol.name}</h2>
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                  {protocol.severity}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">{protocol.description}</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{protocol.chain}</span>
                <span className="text-white">${protocol.bountyPool.toLocaleString()}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
