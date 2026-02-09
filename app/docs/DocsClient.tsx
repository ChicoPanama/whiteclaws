'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { DocRecord } from '@/lib/content/types'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface DocsClientProps {
  docs: DocRecord[]
  sections: string[]
}

export default function DocsClient({ docs, sections }: DocsClientProps) {
  const [query, setQuery] = useState('')
  const [section, setSection] = useState('all')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return docs.filter((doc) => {
      const matchesSection = section === 'all' || doc.section === section
      const matchesQuery =
        !normalized ||
        doc.title.toLowerCase().includes(normalized) ||
        doc.summary.toLowerCase().includes(normalized)
      return matchesSection && matchesQuery
    })
  }, [docs, query, section])

  return (
    <>
      <div className="page-filters">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search docs"
          aria-label="Search docs"
        />
        <Select value={section} onChange={(event) => setSection(event.target.value)}>
          <option value="all">All sections</option>
          {sections.map((name) => (
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
        {filtered.map((doc) => (
          <Card key={doc.slug} as={Link} href={doc.path} interactive>
            <div className="ui-card-meta">
              <span className="ui-card-badge">{doc.section}</span>
            </div>
            <div className="ui-card-title">{doc.title}</div>
            <div className="ui-card-subtitle">{doc.summary}</div>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
        <Card>
          <div className="ui-card-title">No docs found</div>
          <div className="ui-card-subtitle">Try adjusting your search or filters.</div>
        </Card>
      )}
    </>
  )
}
