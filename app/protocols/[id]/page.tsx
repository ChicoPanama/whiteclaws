import { notFound } from 'next/navigation'
import Link from 'next/link'
import SiteLayout from '@/components/shell/SiteLayout'
import PageShell from '@/components/shell/PageShell'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { loadProjectsIndex } from '@/lib/content/fsIndex'

export default async function ProtocolPage({ params }: { params: { id: string } }) {
  const projects = loadProjectsIndex()
  const project = projects.find((entry) => entry.slug === params.id)
  if (!project) notFound()

  return (
    <SiteLayout>
      <PageShell
        title={project.name}
        subtitle={project.description || 'Protocol overview and linked resources.'}
        actions={
          <Button as={Link} href={`/submit?protocol=${project.slug}`} variant="primary">
            Submit finding
          </Button>
        }
      >
        <div className="page-grid">
          <Card>
            <div className="ui-card-title">Coverage</div>
            <div className="ui-card-subtitle">
              {project.chains.length > 0 ? project.chains.join(', ') : 'Multi-chain'}
            </div>
            <div className="ui-card-meta">
              {project.tags.map((tag) => (
                <span key={tag} className="ui-card-badge">
                  {tag}
                </span>
              ))}
            </div>
          </Card>
          <Card>
            <div className="ui-card-title">Key links</div>
            <div className="page-stack">
              {project.links.length > 0 ? (
                project.links.map((link) => (
                  <Button key={link.href} as="a" href={link.href} variant="ghost" size="sm">
                    {link.label}
                  </Button>
                ))
              ) : (
                <div className="ui-card-subtitle">No external links listed yet.</div>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <div className="ui-card-title">Resources</div>
          <div className="page-stack">
            {project.resources.length > 0 ? (
              project.resources.map((resource) => (
                <div key={resource.href} className="page-filters">
                  <div className="ui-card-subtitle">{resource.title}</div>
                  <Button
                    as="a"
                    href={resource.href}
                    variant="outline"
                    size="sm"
                    {...(resource.type === 'pdf'
                      ? { target: '_blank', rel: 'noreferrer' }
                      : {})}
                  >
                    View {resource.type.toUpperCase()}
                  </Button>
                </div>
              ))
            ) : (
              <div className="ui-card-subtitle">No linked resources yet.</div>
            )}
          </div>
        </Card>
      </PageShell>
    </SiteLayout>
  )
}
