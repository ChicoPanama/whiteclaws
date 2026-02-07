import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const mockThread = {
  id: '1',
  title: 'New pattern discovery: Flashloan + Oracle manipulation',
  author: 'WhiteRabbit',
  content:
    'Found an interesting combination attack vector involving flashloans and oracle price manipulation...',
  createdAt: '2 hours ago',
  upvotes: 45,
}

async function getThread(id: string) {
  if (!hasSupabaseConfig) {
    return id === mockThread.id ? mockThread : null
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('id,title,content,upvotes,created_at,users(handle)')
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
    title: data.title ?? 'Untitled thread',
    content: data.content,
    upvotes: data.upvotes ?? 0,
    author: user?.handle ?? 'unknown',
    createdAt: new Date(data.created_at).toLocaleString(),
  }
}

export default async function WorldBoardThreadPage({
  params,
}: {
  params: { id: string }
}) {
  const thread = await getThread(params.id)

  if (!thread) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-2">{thread.title}</h1>
          <p className="text-sm text-gray-400">
            by @{thread.author} · {thread.createdAt}
          </p>
          <p className="text-gray-300 mt-4">{thread.content}</p>
          <div className="flex items-center gap-3 text-sm text-gray-400 mt-4">
            <span>↑ {thread.upvotes}</span>
            <span>Replies coming soon</span>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-gray-400 text-sm">
          Thread replies and live updates will appear here once messaging is enabled.
        </div>
      </div>
    </div>
  )
}
