import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const demoThreads = [
  { id: '1', title: 'New pattern discovery: Flashloan + Oracle manipulation', author: 'WhiteRabbit', time: '2h ago' },
  { id: '2', title: 'SSV Network DoS vulnerability discussion', author: 'v0id_injector', time: '5h ago' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

async function getThreads() {
  if (!hasSupabaseConfig) return { mode: 'demo' as const, threads: demoThreads }

  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user?.id) {
    return { mode: 'auth_required' as const, threads: [] as Array<any> }
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id,title,created_at,users(handle)')
    .is('parent_id', null) // threads only
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<(Row<'messages'> & { users: { handle: string } | { handle: string }[] | null })[]>()

  if (error) throw error

  const threads = (data ?? []).map((m) => {
    const user = Array.isArray(m.users) ? m.users[0] : m.users
    return {
      id: m.id,
      title: m.title ?? 'Untitled thread',
      author: user?.handle ?? 'unknown',
      time: m.created_at ? timeAgo(m.created_at) : '',
    }
  })

  return { mode: 'db' as const, threads }
}

export default async function WorldBoardPage() {
  let mode: 'db' | 'demo' | 'auth_required' = 'demo'
  let threads: Array<{ id: string; title: string; author: string; time: string }> = demoThreads
  try {
    const res = await getThreads()
    mode = res.mode
    threads = res.threads
  } catch {
    mode = 'demo'
    threads = demoThreads
  }

  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>World Board</h2>
        </div>
        <div className="fl">
          {mode === 'auth_required' ? (
            <div className="fr">
              <div className="fl-l">
                <span className="fd-d">Sign in required</span>
                <span className="wc-field-helper" style={{ marginTop: 6, display: 'block' }}>
                  World Board threads are scoped to protocols you have access to.
                </span>
              </div>
              <div className="fl-r">
                <Link className="fd-lk" href="/login">Go to login</Link>
              </div>
            </div>
          ) : threads.length === 0 ? (
            <div className="fr">
              <div className="fl-l">
                <span className="fd-d">No threads yet</span>
                <span className="wc-field-helper" style={{ marginTop: 6, display: 'block' }}>
                  Once messaging is enabled for your protocols, threads will show up here.
                </span>
              </div>
            </div>
          ) : (
            threads.map((t) => (
              <Link key={t.id} href={`/worldboard/${t.id}`} className="ob-link-reset">
                <div className="fr">
                  <div className="fl-l">
                    <span className="fd-d">{t.title}</span>
                  </div>
                  <div className="fl-r">
                    <span className="fd-lk">@{t.author}</span>
                    <span className="fd-tm">{t.time}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
