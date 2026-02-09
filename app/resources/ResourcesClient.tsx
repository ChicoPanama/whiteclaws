'use client'

import { useMemo, useState } from 'react'
import type { ResourceRecord } from '@/lib/content/types'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface ResourcesClientProps {
  resources: ResourceRecord[]
  categories: string[]
}

export default function ResourcesClient({ resources, categories }: ResourcesClientProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return resources.filter((resource) => {
      const matchesCategory = category === 'all' || resource.category === category
      const haystack = `${resource.title} ${resource.protocol ?? ''} ${resource.tags.join(' ')}`.toLowerCase()
      const matchesQuery = !normalized || haystack.includes(normalized)
      return matchesCategory && matchesQuery
    })
  }, [resources, query, category])

  return (
    <>
      <div className="page-filters">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search resources"
          aria-label="Search resources"
        />
        <Select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
        <Button variant="ghost" onClick={() => setQuery('')}>
          Clear
        </Button>
      </div>

      <div className="page-grid">
        {filtered.map((resource) => (
          <Card key={resource.id} interactive className="resource-card">
            <div className="ui-card-meta">
              {resource.category ? <span className="ui-card-badge">{resource.category}</span> : null}
              {resource.protocol ? <span>{resource.protocol}</span> : null}
              {resource.date ? <span>{resource.date}</span> : null}
            </div>
            <div className="ui-card-title">{resource.title}</div>
            <div className="ui-card-meta">
              {resource.tags.map((tag) => (
                <span key={tag} className="ui-card-badge">
                  {tag}
                </span>
              ))}
            </div>
            <Button
              as="a"
              href={resource.href}
              variant="outline"
              size="sm"
              target="_blank"
              rel="noreferrer"
            >
              View PDF
            </Button>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <div className="ui-card-title">No resources found</div>
          <div className="ui-card-subtitle">Try adjusting your search or filters.</div>
        </Card>
      )}
    </>
  )
}
