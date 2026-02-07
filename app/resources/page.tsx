import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const hasSupabaseConfig = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const mockResources = [
  {
    id: '1',
    title: 'Smart Contract Vulnerabilities Handbook',
    type: 'pdf',
    author: 'v0id_injector',
    downloads: 1234,
    description: 'Comprehensive guide to common smart contract vulnerabilities',
    tags: ['security', 'vulnerabilities', 'handbook'],
  },
  {
    id: '2',
    title: 'Foundry Testing Best Practices',
    type: 'article',
    author: 'WhiteRabbit',
    downloads: 892,
    description: 'How to write effective PoC tests with Foundry',
    tags: ['foundry', 'testing', 'poc'],
  },
]

const mockAudits = [
  {
    id: 'audit-1',
    title: 'Oak Network Audit Report',
    type: 'pdf',
    author: 'Immunefi',
    downloads: 45,
    description: 'Security audit for Oak Network PaymentTreasury',
    tags: ['immunefi', 'audit', 'oak-network'],
  },
]

async function getResources() {
  if (!hasSupabaseConfig) {
    return { resources: mockResources, audits: mockAudits }
  }
  const supabase = createClient()
  
  // Get all resources
  const { data, error } = await supabase
    .from('resources')
    .select('id,title,type,description,downloads,author_id,users (handle),tags,url,file_path')
    .order('created_at', { ascending: false })
  
  if (error) {
    throw error
  }
  
  const allResources = (data ?? []).map((resource) => {
    const user = Array.isArray(resource.users) ? resource.users[0] : resource.users
    return {
      id: resource.id,
      title: resource.title,
      type: resource.type ?? 'article',
      description: resource.description ?? 'No description provided.',
      downloads: resource.downloads ?? 0,
      author: user?.handle ?? 'WhiteClaws',
      tags: resource.tags ?? [],
      url: resource.url,
      file_path: resource.file_path,
    }
  })
  
  // Separate audits from other resources
  const audits = allResources.filter(r => 
    r.tags?.includes('immunefi') && r.tags?.includes('audit')
  )
  const resources = allResources.filter(r => 
    !(r.tags?.includes('immunefi') && r.tags?.includes('audit'))
  )
  
  return { resources, audits }
}

export default async function ResourcesPage() {
  const { resources, audits } = await getResources()
  
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Resources</h1>
          <p className="text-gray-400">Security tools, guides, and audit reports for whitehat researchers</p>
        </div>
        
        {/* Audit Reports Section */}
        {audits.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🔍</span>
              <h2 className="text-xl font-semibold text-white">Audit Reports</h2>
              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                {audits.length} reports
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {audits.map((audit) => (
                <a
                  key={audit.id}
                  href={audit.url || `/resources/${audit.id}`}
                  target={audit.url?.startsWith('/') ? undefined : '_blank'}
                  rel={audit.url?.startsWith('/') ? undefined : 'noopener noreferrer'}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white">{audit.title}</h3>
                    <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded uppercase font-medium">
                      {audit.type}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{audit.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {audit.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>by @{audit.author}</span>
                    <span>{audit.downloads} downloads</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* Community Resources Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📚</span>
            <h2 className="text-xl font-semibold text-white">Community Resources</h2>
            <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
              {resources.length} resources
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resources.map((resource) => (
              <a
                key={resource.id}
                href={`/resources/${resource.id}`}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white">{resource.title}</h3>
                  <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded uppercase">
                    {resource.type}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4">{resource.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {resource.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>by @{resource.author}</span>
                  <span>{resource.downloads} downloads</span>
                </div>
              </a>
            ))}
          </div>
        </div>
        
        {/* Upload CTA */}
        <div className="mt-12 p-6 bg-gray-800 rounded-lg border border-dashed border-gray-600 text-center">
          <p className="text-gray-400 mb-2">Have a resource to share?</p>
          <button className="text-blue-400 hover:text-blue-300 font-medium">
            Submit a resource →
          </button>
        </div>
      </div>
    </div>
  )
}
