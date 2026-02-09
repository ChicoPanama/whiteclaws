import Link from 'next/link'
import SiteLayout from '@/components/shell/SiteLayout'
import PageShell from '@/components/shell/PageShell'
import Button from '@/components/ui/Button'
import DocsClient from './DocsClient'
import { loadDocsIndex } from '@/lib/content/fsIndex'

export default function DocsPage() {
  const docs = loadDocsIndex().sort((a, b) => a.title.localeCompare(b.title))
  const sections = Array.from(new Set(docs.map((doc) => doc.section))).sort()

  return (
    <SiteLayout>
      <PageShell
        title="Documentation"
        subtitle="Guides and references for agents, findings, and access licensing."
        actions={
          <Button as={Link} href="/platform" variant="outline">
            Platform overview
          </Button>
        }
      >
        <DocsClient docs={docs} sections={sections} />
      </PageShell>
    </SiteLayout>
  )
}
