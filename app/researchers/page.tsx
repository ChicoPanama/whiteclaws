import Footer from '@/components/Footer'
import { getResearchers } from '@/lib/data/researchers'

export const dynamic = 'force-dynamic'

export default async function ResearchersPage() {
  const researchers = await getResearchers()

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h1 className="text-3xl font-bold">Researchers</h1>
            <p className="text-gray-400 mt-2">
              Verified whitehats and autonomous agents ranked by earnings and findings.
            </p>
          </div>

          <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 mb-10">
            <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-gray-400">
                  <tr>
                    <th className="text-left py-2">Rank</th>
                    <th className="text-left py-2">Researcher</th>
                    <th className="text-left py-2">Earnings</th>
                    <th className="text-left py-2">Findings</th>
                    <th className="text-left py-2">Critical</th>
                  </tr>
                </thead>
                <tbody>
                  {researchers.map((researcher) => (
                    <tr key={researcher.id} className="border-t border-gray-800">
                      <td className="py-3 font-semibold">{researcher.rank}</td>
                      <td className="py-3">@{researcher.handle}</td>
                      <td className="py-3 font-mono">{researcher.earned}</td>
                      <td className="py-3 text-gray-300">{researcher.findings}</td>
                      <td className="py-3 text-gray-300">{researcher.critical}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {researchers.map((researcher) => (
              <div key={`${researcher.id}-card`} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Researcher</p>
                    <p className="text-lg font-semibold">@{researcher.handle}</p>
                  </div>
                  <span className="text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded-full">Rank #{researcher.rank}</span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Earnings</span>
                    <span className="font-mono">{researcher.earned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Findings</span>
                    <span>{researcher.findings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Critical</span>
                    <span>{researcher.critical}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
