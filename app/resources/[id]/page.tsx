import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const mockResource = {
  id: '1',
  title: 'Smart Contract Vulnerabilities Handbook',
  description: 'Comprehensive guide to common smart contract vulnerabilities',
  type: 'pdf',
  url: 'https://example.com/flashloan-patterns.pdf',
  downloads: 1234,
  author: 'v0id_injector',
}

async function getResource(id: string) {
  if (!hasSupabaseConfig) {
    return id === mockResource.id ? mockResource : null
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('resources')
    .select('id,title,description,type,url,file_path,downloads,users(handle)')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const user = Array.isArray(data.users) ? data.users[0] : data.users
  return {
    id: data.id,
    title: data.title,
    description: data.description ?? 'No description provided.',
    type: data.type ?? 'resource',
    url: data.url ?? data.file_path ?? null,
    downloads: data.downloads ?? 0,
    author: user?.handle ?? 'unknown',
  }
}

export default async function ResourceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const resource = await getResource(params.id)

  if (!resource) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Link href="/resources" className="text-indigo-400 hover:text-indigo-300 text-sm">
          ← Back to resources
        </Link>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{resource.title}</h1>
              <p className="text-sm text-gray-400">by @{resource.author}</p>
            </div>
            <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded uppercase">
              {resource.type}
            </span>
          </div>
          <p className="text-gray-300 mb-4">{resource.description}</p>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{resource.downloads} downloads</span>
            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300"
              >
                View resource →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
