import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const mockThreads = [
  {
    id: '1',
    title: 'New pattern discovery: Flashloan + Oracle manipulation',
    author: 'WhiteRabbit',
    replies: 23,
    upvotes: 45,
    createdAt: '2 hours ago',
  },
  {
    id: '2',
    title: 'SSV Network DoS vulnerability discussion',
    author: 'v0id_injector',
    replies: 12,
    upvotes: 34,
    createdAt: '5 hours ago',
  },
]

async function getThreads() {
  if (!hasSupabaseConfig) {
    return mockThreads
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('id,title,author_id,upvotes,created_at,users(handle)')
    .is('protocol_id', null)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((thread) => {
    const user = Array.isArray(thread.users) ? thread.users[0] : thread.users
    return {
      id: thread.id,
      title: thread.title ?? 'Untitled thread',
      author: user?.handle ?? 'unknown',
      replies: 0,
      upvotes: thread.upvotes ?? 0,
      createdAt: new Date(thread.created_at).toLocaleDateString(),
    }
  })
}

export default async function WorldBoardPage() {
  const threads = await getThreads()

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">World Board</h1>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            New Thread
          </button>
        </div>
        <div className="space-y-4">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/worldboard/${thread.id}`}
              className="block bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">{thread.title}</h2>
                  <p className="text-sm text-gray-400">
                    by @{thread.author} · {thread.createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>↑ {thread.upvotes}</span>
                  <span>{thread.replies} replies</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
