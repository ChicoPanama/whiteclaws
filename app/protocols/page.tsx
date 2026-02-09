import Link from 'next/link'
import SiteLayout from '@/components/shell/SiteLayout'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const mockProtocols = [
  {
    id: '1',
    name: 'SSV Network',
    slug: 'ssv-network',
    description: 'Distributed validator infrastructure for Ethereum',
    chain: 'Ethereum',
    bountyPool: 1000000,
  },
  {
    id: '2',
    name: 'Uniswap',
    slug: 'uniswap',
    description: 'Decentralized exchange protocol',
    chain: 'Ethereum',
    bountyPool: 2500000,
  },
]

async function getProtocols() {
  if (!hasSupabaseConfig) {
    return mockProtocols
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('protocols')
    .select('id,name,slug,description,chains,max_bounty')
    .order('name')

  if (error) {
    throw error
  }

  return (data ?? []).map((protocol) => ({
    id: protocol.id,
    name: protocol.name,
    slug: protocol.slug,
    description: protocol.description ?? 'No description provided.',
    chain: protocol.chains?.[0] ?? 'Multi-chain',
    bountyPool: protocol.max_bounty ?? 0,
  }))
}

export default async function ProtocolsPage() {
  const protocols = await getProtocols()

  return (
    <SiteLayout>
      <div className="section-reveal visible">
        <div className="sh">
          <span className="num">Protocols</span>
          <h2>Active Programs</h2>
          <span className="lk">Explore</span>
        </div>
        <div className="dg">
          {protocols.map((protocol) => (
            <div key={protocol.id} className="nb">
              <h3>{protocol.name}</h3>
              <p>{protocol.description}</p>
              <p style={{ marginTop: 12 }}>Chain: {protocol.chain}</p>
              <p>Max bounty: ${protocol.bountyPool.toLocaleString()}</p>
              <Link href={`/bounties/${protocol.slug}`} className="btn btn-w" style={{ marginTop: 16, display: 'inline-flex' }}>
                View Bounty →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  )
}
