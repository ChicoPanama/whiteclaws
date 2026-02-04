import Link from "next/link";

interface ProtocolCardProps {
  name: string;
  slug: string;
  description?: string;
  chain?: string;
  bountyPool?: number;
  maxBounty?: number;
  assetsInScope?: number;
  tvl?: string;
  tags?: string[];
}

export default function ProtocolCard({ 
  name, 
  slug, 
  description, 
  chain, 
  bountyPool,
  maxBounty,
  assetsInScope,
  tvl,
  tags
}: ProtocolCardProps) {
  const displayBounty = bountyPool ?? maxBounty ?? 0;
  
  return (
    <Link 
      href={`/protocols/${slug}`} 
      className="block bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-indigo-500 transition-colors"
      role="article"
    >
      <h3 className="text-xl font-semibold text-white mb-2">{name}</h3>
      {description && <p className="text-gray-400 text-sm mb-4">{description}</p>}
      <div className="flex justify-between text-sm items-center">
        {chain && <span className="text-gray-500">{chain}</span>}
        {tvl && <span className="text-gray-500">{tvl}</span>}
        <span className="text-white font-medium">${displayBounty.toLocaleString()}</span>
      </div>
      {assetsInScope !== undefined && (
        <div className="mt-2 text-sm text-gray-400">
          {assetsInScope} {assetsInScope === 1 ? 'asset' : 'assets'} in scope
        </div>
      )}
      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
