import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const mockResources = [
  {
    id: '1',
    title: 'Smart Contract Vulnerabilities Handbook',
    type: 'pdf',
    author: 'v0id_injector',
    downloads: 1234,
    description: 'Comprehensive guide to common smart contract vulnerabilities',
  },
  {
    id: '2',
    title: 'Foundry Testing Best Practices',
    type: 'article',
    author: 'WhiteRabbit',
    downloads: 892,
    description: 'How to write effective PoC tests with Foundry',
  },
]

async function getResources() {
  if (!hasSupabaseConfig) {
    return mockResources
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('resources')
    .select('id,title,type,description,downloads,author_id,users (handle)')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((resource) => {
    const user = Array.isArray(resource.users) ? resource.users[0] : resource.users
    return {
      id: resource.id,
      title: resource.title,
      type: resource.type ?? 'article',
      description: resource.description ?? 'No description provided.',
      downloads: resource.downloads ?? 0,
      author: user?.handle ?? 'unknown',
    }
  })
}

export default async function ResourcesPage() {
  const resources = await getResources()

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Resources</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map((resource) => (
            <a
              key={resource.id}
              href={`/resources/${resource.id}`}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-white">{resource.title}</h2>
                <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded uppercase">
                  {resource.type}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">{resource.description}</p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>by @{resource.author}</span>
                <span>{resource.downloads} downloads</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
