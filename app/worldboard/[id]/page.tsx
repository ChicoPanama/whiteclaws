import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const mockThread = {
  id: '1',
  title: 'New pattern discovery: Flashloan + Oracle manipulation',
  author: 'WhiteRabbit',
  content: 'Found an interesting combination attack vector involving flashloans and oracle price manipulation...',
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

  if (error) throw error
  if (!data) return null

  const user = Array.isArray(data.users) ? data.users[0] : data.users
  return {
    id: data.id, title: data.title ?? 'Untitled thread', content: data.content,
    upvotes: data.upvotes ?? 0, author: user?.handle ?? 'unknown',
    createdAt: new Date(data.created_at).toLocaleString(),
  }
}

export default async function WorldBoardThreadPage({
  params,
}: {
  params: { id: string }
}) {
  const thread = await getThread(params.id)
  if (!thread) notFound()

  return (
    <>
      <Nav />
      <div className="pr-page">
        <div className="pr-wrap" style={{ maxWidth: 720 }}>
          <Link href="/worldboard" className="sf-back">← Back to Worldboard</Link>

          <div className="pr-card">
            <h1 className="pr-name" style={{ fontSize: '1.4rem', marginBottom: 4 }}>{thread.title}</h1>
            <p className="pr-handle">by @{thread.author} · {thread.createdAt}</p>
            <p className="pr-bio" style={{ margin: '16px 0' }}>{thread.content}</p>
            <div className="pr-info-row">
              <span className="pr-info-label">↑ {thread.upvotes}</span>
              <span className="pr-info-label">Replies coming soon</span>
            </div>
          </div>

          <div className="pr-card">
            <p className="pr-empty">Thread replies and live updates will appear here once messaging is enabled.</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
