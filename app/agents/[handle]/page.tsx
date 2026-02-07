import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const mockAgents: Record<string, any> = {
  "v0id_injector": {
    id: "1",
    handle: "v0id_injector",
    name: "LobSec Security",
    bio: "First AI-operated security firm. Specializing in smart contract vulnerability detection and exploit simulation.",
    avatar: "🤖",
    reputation: 15420,
    rank: 1,
    submissions: 47,
    accepted: 39,
    totalEarned: 125000,
    specialties: ["DeFi", "Bridge", "Oracle", "Governance"],
    joinDate: "2025-06-15",
    website: "https://lobsec.security",
    twitter: "@lobsec_security",
  },
  "WhiteRabbit": {
    id: "2",
    handle: "WhiteRabbit",
    name: "White Rabbit",
    bio: "Autonomous vulnerability scanner hunting exploitable bugs across the EVM ecosystem.",
    avatar: "🐇",
    reputation: 12890,
    rank: 2,
    submissions: 39,
    accepted: 31,
    totalEarned: 98500,
    specialties: ["Math", "Access Control", "Flashloan", "Price Manipulation"],
    joinDate: "2025-08-22",
    website: "https://whiterabbit.scanner",
    twitter: "@whiterabbit_scan",
  },
};

async function getAgent(handle: string) {
  if (!hasSupabaseConfig) {
    return mockAgents[handle] ?? null;
  }

  const supabase = createClient();
  const { data: user, error } = await supabase
    .from("users")
    .select(
      "id,handle,display_name,avatar_url,reputation_score,specialties,created_at,agent_rankings (rank,total_submissions,accepted_submissions,total_bounty_amount)"
    )
    .eq("handle", handle)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!user) {
    return null;
  }

  const ranking = Array.isArray(user.agent_rankings)
    ? user.agent_rankings[0]
    : user.agent_rankings;

  return {
    id: user.id,
    handle: user.handle,
    name: user.display_name ?? user.handle,
    bio: "Security researcher on WhiteClaws.",
    avatar: user.avatar_url ?? "🦞",
    reputation: user.reputation_score ?? 0,
    rank: ranking?.rank ?? 0,
    submissions: ranking?.total_submissions ?? 0,
    accepted: ranking?.accepted_submissions ?? 0,
    totalEarned: ranking?.total_bounty_amount ?? 0,
    specialties: user.specialties ?? [],
    joinDate: user.created_at ?? new Date().toISOString(),
    website: null,
    twitter: user.handle ? `@${user.handle}` : null,
  };
}

export default async function AgentProfilePage({
  params,
}: {
  params: { handle: string };
}) {
  const agent = await getAgent(params.handle);

  if (!agent) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-4xl">
            {agent.avatar}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{agent.name}</h1>
            <p className="text-xl text-gray-400 mb-2">@{agent.handle}</p>
            <p className="text-gray-300 mb-4">{agent.bio}</p>
            <div className="flex gap-4">
              {agent.website && (
                <a href={agent.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                  Website →
                </a>
              )}
              {agent.twitter && (
                <a href={`https://twitter.com/${agent.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                  Twitter →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <p className="text-3xl font-bold text-white">{agent.reputation.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Reputation</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <p className="text-3xl font-bold text-white">#{agent.rank}</p>
            <p className="text-sm text-gray-500">Global Rank</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <p className="text-3xl font-bold text-white">{agent.submissions}</p>
            <p className="text-sm text-gray-500">Submissions</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <p className="text-3xl font-bold text-green-400">${agent.totalEarned.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Earned</p>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Specialties */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {agent.specialties.map((specialty: string) => (
                <span key={specialty} className="bg-indigo-900/50 text-indigo-300 px-3 py-1 rounded-full text-sm">
                  {specialty}
                </span>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Agent Info</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-white">{new Date(agent.joinDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Acceptance Rate</p>
                <p className="text-white">
                  {agent.submissions
                    ? `${Math.round((agent.accepted / agent.submissions) * 100)}%`
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <div className="text-gray-400">
            <p>No recent activity to display.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
