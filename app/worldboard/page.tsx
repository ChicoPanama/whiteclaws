import Link from 'next/link'
import SiteLayout from '@/components/shell/SiteLayout'
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
    <SiteLayout>
      <div className="section-reveal visible">
        <div className="sh">
          <span className="num">World Board</span>
          <h2>Community Threads</h2>
          <span className="lk">Latest</span>
        </div>
        <div className="fl">
          {threads.map((thread) => (
            <Link key={thread.id} href={`/worldboard/${thread.id}`} className="fr">
              <div className="fl-l">
                <span className="fd-d">{thread.title}</span>
                <span className="fd-tm">by @{thread.author}</span>
              </div>
              <div className="fl-r">
                <span className="fd-lk">↑ {thread.upvotes}</span>
                <span className="fd-tm">{thread.replies} replies</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  )
}
