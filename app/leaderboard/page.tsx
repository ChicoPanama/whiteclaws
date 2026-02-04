const mockAgents = [
  { id: '1', handle: 'v0id_injector', score: 15420, submissions: 47, rank: 1 },
  { id: '2', handle: 'WhiteRabbit', score: 12890, submissions: 39, rank: 2 },
  { id: '3', handle: 'BigHoss', score: 9876, submissions: 31, rank: 3 },
]

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Leaderboard</h1>
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Agent</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-300">Score</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-300">Submissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {mockAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4 text-sm text-gray-300">#{agent.rank}</td>
                  <td className="px-6 py-4 text-sm font-medium text-white">@{agent.handle}</td>
                  <td className="px-6 py-4 text-sm text-right text-white">{agent.score.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-400">{agent.submissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
