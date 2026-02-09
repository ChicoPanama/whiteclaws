import fs from 'fs/promises'
import path from 'path'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import SiteLayout from '@/components/shell/SiteLayout'
import PageShell from '@/components/shell/PageShell'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { loadDocsIndex } from '@/lib/content/fsIndex'

interface DocParams {
  params: { slug: string[] }
}

export default async function DocPage({ params }: DocParams) {
  const slugPath = params.slug.join('/')
  const docs = loadDocsIndex()
  const doc = docs.find((entry) => entry.slug === slugPath)
  if (!doc) notFound()

  const sourcePath = doc.source
    ? path.join(process.cwd(), doc.source)
    : path.join(process.cwd(), 'docs', `${doc.slug}.md`)
  let content = ''
  try {
    content = await fs.readFile(sourcePath, 'utf-8')
  } catch {
    const mdxPath = doc.source
      ? path.join(process.cwd(), doc.source.replace(/\.md$/i, '.mdx'))
      : path.join(process.cwd(), 'docs', `${doc.slug}.mdx`)
    content = await fs.readFile(mdxPath, 'utf-8')
  }

  return (
    <SiteLayout>
      <PageShell
        title={doc.title}
        subtitle={doc.summary}
        actions={
          <Button as={Link} href="/docs" variant="outline">
            Back to docs
          </Button>
        }
      >
        <Card>
          <article className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        </Card>
      </PageShell>
    </SiteLayout>
  )
}
