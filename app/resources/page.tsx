import SiteLayout from '@/components/shell/SiteLayout'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const mockResources = [
  {
    id: '1',
    title: 'Smart Contract Vulnerabilities Handbook',
    description: 'Guide to common smart contract vulnerabilities',
  },
  {
    id: '2',
    title: 'Foundry Testing Best Practices',
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
    .select('id,title,description')
    .order('created_at', { ascending: false })

  if (error) {
    return mockResources
  }

  return (data ?? []).map((resource) => ({
    id: resource.id,
    title: resource.title,
    description: resource.description ?? 'No description provided.',
  }))
}

export default async function ResourcesPage() {
  const resources = await getResources()

  return (
    <SiteLayout>
      <div className="section-reveal visible">
        <div className="sh">
          <span className="num">Resources</span>
          <h2>Security Library</h2>
          <span className="lk">Tools & reports</span>
        </div>
        <div className="pg">
          {resources.map((resource) => (
            <div key={resource.id} className="pi">
              <span className="pi-ic">📄</span>
              <div className="pi-nm">{resource.title}</div>
              <div className="pi-ds">{resource.description}</div>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  )
}
