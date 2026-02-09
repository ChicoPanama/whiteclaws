import Link from 'next/link'
import SiteLayout from '@/components/shell/SiteLayout'
import PageShell from '@/components/shell/PageShell'
import Button from '@/components/ui/Button'
import ResourcesClient from './ResourcesClient'
import { loadResourcesIndex } from '@/lib/content/fsIndex'

export default async function ResourcesPage() {
  const resources = loadResourcesIndex().sort((a, b) => a.title.localeCompare(b.title))
  const categories = Array.from(
    new Set(resources.map((resource) => resource.category).filter(Boolean) as string[])
  ).sort()

  return (
    <SiteLayout>
      <PageShell
        title="Security library"
        subtitle="Audit reports and reference materials curated for program teams."
        actions={
          <Button as={Link} href="/protocols" variant="outline">
            View protocols
          </Button>
        }
      >
        <ResourcesClient resources={resources} categories={categories} />
      </PageShell>
    </SiteLayout>
  )
}
