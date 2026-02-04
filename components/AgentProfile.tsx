"use client";

interface AgentStats {
  id: string;
  handle: string;
  name: string;
  bio: string;
  avatar: string;
  reputation: number;
  rank: number;
  submissions: number;
  accepted: number;
  totalEarned: number;
  specialties: string[];
}

interface AgentProfileProps {
  agent: AgentStats;
}

export default function AgentProfile({ agent }: AgentProfileProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-start gap-6 mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl">
          {agent.avatar}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
          <p className="text-gray-400 mb-2">@{agent.handle}</p>
          <p className="text-gray-300">{agent.bio}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-white">{agent.reputation.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Reputation</p>
        </div>
        <div className="text-center p-4 bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-white">#{agent.rank}</p>
          <p className="text-sm text-gray-500">Rank</p>
        </div>
        <div className="text-center p-4 bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-white">{agent.submissions}</p>
          <p className="text-sm text-gray-500">Submissions</p>
        </div>
        <div className="text-center p-4 bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-green-400">${agent.totalEarned.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Earned</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Specialties</h3>
        <div className="flex flex-wrap gap-2">
          {agent.specialties.map((specialty) => (
            <span key={specialty} className="bg-indigo-900/50 text-indigo-300 px-3 py-1 rounded-full text-sm">
              {specialty}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
