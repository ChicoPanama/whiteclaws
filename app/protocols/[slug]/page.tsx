import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const mockProtocols: Record<string, any> = {
  "ssv-network": {
    id: "1",
    name: "SSV Network",
    slug: "ssv-network",
    description:
      "Distributed validator infrastructure for Ethereum. Run validators in a distributed, fault-tolerant manner.",
    chain: "Ethereum",
    contractAddress: "0xDD9BC35aE942eF0cFa76930954a156B3fF30a4E1",
    website: "https://ssv.network",
    twitter: "@ssv_network",
    bountyPool: 1000000,
    maxSeverity: "critical",
    totalSubmissions: 47,
    totalPaid: 250000,
    contractTypes: ["Solidity", "Staking"],
  },
  uniswap: {
    id: "2",
    name: "Uniswap",
    slug: "uniswap",
    description:
      "Decentralized exchange protocol for automated token swaps. Leading AMM on Ethereum.",
    chain: "Ethereum",
    contractAddress: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    website: "https://uniswap.org",
    twitter: "@Uniswap",
    bountyPool: 2500000,
    maxSeverity: "critical",
    totalSubmissions: 128,
    totalPaid: 800000,
    contractTypes: ["Solidity", "DEX"],
  },
};

async function getProtocol(slug: string) {
  if (!hasSupabaseConfig) {
    return mockProtocols[slug] ?? null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("protocols")
    .select(
      "id,name,slug,description,immunefi_url,chains,max_bounty,tvl,logo_url,contracts"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description ?? "No description provided.",
    chain: data.chains?.[0] ?? "Multi-chain",
    contractAddress: Array.isArray(data.contracts) ? data.contracts[0] : null,
    website: data.immunefi_url ?? null,
    twitter: null,
    bountyPool: data.max_bounty ?? 0,
    maxSeverity: "critical",
    totalSubmissions: 0,
    totalPaid: 0,
    contractTypes: data.chains?.length ? data.chains : ["Smart Contract"],
  };
}

export default async function ProtocolDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const protocol = await getProtocol(params.slug);

  if (!protocol) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{protocol.name}</h1>
              <p className="text-gray-400">{protocol.chain}</p>
            </div>
            <Link
              href={`/protocols/${protocol.slug}/submit`}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Submit Finding
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <p className="text-sm text-gray-500 mb-1">Bounty Pool</p>
            <p className="text-2xl font-bold text-white">${protocol.bountyPool.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <p className="text-sm text-gray-500 mb-1">Max Severity</p>
            <p className="text-2xl font-bold text-green-400 capitalize">{protocol.maxSeverity}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <p className="text-sm text-gray-500 mb-1">Total Submissions</p>
            <p className="text-2xl font-bold text-white">{protocol.totalSubmissions}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <p className="text-sm text-gray-500 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-white">${protocol.totalPaid.toLocaleString()}</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">About</h2>
          <p className="text-gray-300">{protocol.description}</p>
        </div>

        {/* Contract Info */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Contract</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Address:</span>{" "}
              <span className="text-gray-300 font-mono">
                {protocol.contractAddress ?? "Not provided"}
              </span>
            </p>
            <p>
              <span className="text-gray-500">Type:</span>{" "}
              <span className="text-gray-300">
                {protocol.contractTypes.join(", ")}
              </span>
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-4">
          {protocol.website && (
            <a
              href={protocol.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300"
            >
              Website →
            </a>
          )}
          {protocol.twitter && (
            <a
              href={`https://twitter.com/${protocol.twitter.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300"
            >
              Twitter →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
