import Link from 'next/link'
import type { Row } from '@/lib/supabase/helpers'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'

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
    .returns<(Row<'resources'> & { users: { handle: string } | { handle: string }[] | null })[]>().maybeSingle()

  if (error) throw error
  if (!data) return null

  const user = Array.isArray(data.users) ? data.users[0] : data.users
  return {
    id: data.id, title: data.title, description: data.description ?? 'No description provided.',
    type: data.type ?? 'resource', url: data.url ?? data.file_path ?? null,
    downloads: data.downloads ?? 0, author: user?.handle ?? 'unknown',
  }
}

export default async function ResourceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const resource = await getResource(params.id)
  if (!resource) notFound()

  return (
    <>
      <Nav />
      <div className="pr-page">
        <div className="pr-wrap" style={{ maxWidth: 720 }}>
          <Link href="/resources" className="sf-back">← Back to resources</Link>

          <div className="pr-card">
            <div className="pr-card-header">
              <div>
                <h1 className="pr-name" style={{ fontSize: '1.4rem' }}>{resource.title}</h1>
                <p className="pr-handle">by @{resource.author}</p>
              </div>
              <span className="pr-tag">{resource.type}</span>
            </div>
            <p className="pr-bio" style={{ margin: '16px 0' }}>{resource.description}</p>
            <div className="pr-info-row">
              <span className="pr-info-label">{resource.downloads} downloads</span>
              {resource.url && (
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="pr-ext-link">
                  View resource →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
