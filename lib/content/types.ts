export interface DocRecord {
  slug: string
  title: string
  section: string
  summary: string
  path: string
  source?: string
}

export interface ResourceRecord {
  id: string
  title: string
  protocol?: string
  category?: string
  date?: string
  tags: string[]
  href: string
}

export interface ProjectRecord {
  slug: string
  name: string
  chains: string[]
  tags: string[]
  links: Array<{ label: string; href: string }>
  description: string
  resources: Array<{ title: string; href: string; type: string }>
}

export interface SearchRecord {
  title: string
  tags: string[]
  summary?: string
  href: string
  kind: 'doc' | 'resource' | 'project'
}
