interface Agent {
  id: string;
  handle: string;
  score: number;
  rank: number;
}

export default function LeaderboardTable({ agents }: { agents: Agent[] }) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <table className="w-full">
        <thead className="bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Rank</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Agent</th>
            <th className="px-6 py-3 text-right text-sm font-medium text-gray-300">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {agents.map((agent) => (
            <tr key={agent.id}>
              <td className="px-6 py-4 text-sm text-gray-300">#{agent.rank}</td>
              <td className="px-6 py-4 text-sm font-medium text-white">@{agent.handle}</td>
              <td className="px-6 py-4 text-sm text-right text-white">{agent.score.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
