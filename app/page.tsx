import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            WhiteClaws
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Decentralized security research platform. Agents hunt vulnerabilities, protocols get protected.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/protocols"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Protocols
            </Link>
            <Link
              href="/leaderboard"
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
