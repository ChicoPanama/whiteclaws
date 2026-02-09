import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import type { DocRecord, ProjectRecord, ResourceRecord, SearchRecord } from './types'

const ROOT = process.cwd()
const CONTENT_INDEX_DIR = path.join(ROOT, 'content-index')

function isFileSync(filePath: string) {
  try {
    return fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

function listFiles(dir: string, extensions: string[]) {
  if (!fs.existsSync(dir)) return []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const resolved = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return listFiles(resolved, extensions)
    }
    if (extensions.includes(path.extname(entry.name).toLowerCase())) {
      return [resolved]
    }
    return []
  })
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function readYamlFile<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return yaml.parse(raw) as T
  } catch {
    return null
  }
}

function toTitleFromFile(filePath: string) {
  const base = decodeURIComponent(path.basename(filePath))
  return base
    .replace(path.extname(base), '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function metaForFile(filePath: string) {
  const dir = path.dirname(filePath)
  const base = path.basename(filePath, path.extname(filePath))
  const metaCandidates = [
    path.join(dir, 'meta.json'),
    path.join(dir, `${base}.meta.json`),
  ]
  return metaCandidates.reduce<Record<string, any>>((acc, candidate) => {
    if (isFileSync(candidate)) {
      const meta = readJsonFile<Record<string, any>>(candidate)
      return { ...acc, ...(meta ?? {}) }
    }
    return acc
  }, {})
}

function summarizeMarkdown(content: string) {
  const lines = content.split('\n').map((line) => line.trim())
  const titleLine = lines.find((line) => line.startsWith('# '))
  const title = titleLine ? titleLine.replace(/^#\s+/, '').trim() : 'Untitled'
  const summaryLine = lines.find(
    (line) =>
      line &&
      !line.startsWith('#') &&
      !line.startsWith('>') &&
      !line.startsWith('```')
  )
  return {
    title,
    summary: summaryLine ?? 'No summary provided.',
  }
}

function extractDateFromFilename(filename: string) {
  const match = filename.match(/(20\\d{2})[-_.](\\d{2})[-_.]?(\\d{2})?/)
  if (!match) return undefined
  const year = match[1]
  const month = match[2]
  const day = match[3] ?? '01'
  return `${year}-${month}-${day}`
}

export function buildDocsIndex(): DocRecord[] {
  const docsDir = path.join(ROOT, 'docs')
  const docFiles = listFiles(docsDir, ['.md', '.mdx'])
  return docFiles.map((filePath) => {
    const relative = path.relative(docsDir, filePath)
    const slug = relative.replace(path.extname(relative), '').split(path.sep).join('/')
    const content = fs.readFileSync(filePath, 'utf-8')
    const meta = metaForFile(filePath)
    const fallback = summarizeMarkdown(content)
    const section = meta.section ?? slug.split('/')[0] ?? 'general'
    const title = meta.title ?? fallback.title
    const summary = meta.summary ?? fallback.summary
    return {
      slug,
      title,
      section,
      summary,
      path: `/docs/${slug}`,
      source: path.relative(ROOT, filePath),
    }
  })
}

export function buildResourcesIndex(): ResourceRecord[] {
  const auditsDir = path.join(ROOT, 'public', 'audits')
  const files = listFiles(auditsDir, ['.pdf'])
  return files.map((filePath) => {
    const meta = metaForFile(filePath)
    const filename = path.basename(filePath)
    const id = meta.id ?? filename.replace(/\\.pdf$/i, '')
    const title = meta.title ?? toTitleFromFile(filePath)
    const protocol = meta.protocol
    const category = meta.category ?? 'Audit'
    const date = meta.date ?? extractDateFromFilename(filename)
    const tags = Array.isArray(meta.tags) ? meta.tags : []
    const href = `/${path.relative(path.join(ROOT, 'public'), filePath).split(path.sep).join('/')}`
    return {
      id,
      title,
      protocol,
      category,
      date,
      tags,
      href: encodeURI(href),
    }
  })
}

function normalizeLinks(metadata: Record<string, any> | undefined) {
  const links: Array<{ label: string; href: string }> = []
  if (!metadata) return links
  const maybePush = (label: string, href?: string | null) => {
    if (href) links.push({ label, href })
  }
  maybePush('Website', metadata.website)
  if (Array.isArray(metadata.documentation)) {
    metadata.documentation.forEach((href: string, index: number) =>
      maybePush(`Docs ${index + 1}`, href)
    )
  }
  maybePush('GitHub', metadata.github)
  maybePush('Twitter', metadata.twitter ? `https://twitter.com/${metadata.twitter.replace('@', '')}` : null)
  maybePush('Discord', metadata.discord)
  return links
}

export function buildProjectsIndex(): ProjectRecord[] {
  const projects: Record<string, ProjectRecord> = {}
  const dataDir = path.join(ROOT, 'data', 'protocols')
  const dataFiles = listFiles(dataDir, ['.json', '.yml', '.yaml'])

  dataFiles.forEach((filePath) => {
    const ext = path.extname(filePath).toLowerCase()
    const data =
      ext === '.json'
        ? readJsonFile<Record<string, any>>(filePath)
        : readYamlFile<Record<string, any>>(filePath)
    if (!data) return
    const slug = data.slug ?? data.metadata?.slug ?? path.basename(filePath, ext)
    const metadata = data.metadata ?? {}
    const name = metadata.name ?? data.protocol_name ?? slug
    const description = metadata.description ?? data.description ?? ''
    const chains = data.assets?.chains ?? data.chains ?? []
    const tags: string[] = []
    if (metadata.is_defi) tags.push('DeFi')
    if (metadata.is_gaming) tags.push('Gaming')
    if (metadata.is_nft) tags.push('NFT')
    if (data.source) tags.push(String(data.source))
    const links = normalizeLinks(metadata)

    projects[slug] = {
      slug,
      name,
      chains: chains.map((chain: string) => chain.toString()),
      tags,
      links,
      description,
      resources: [],
    }
  })

  const publicDir = path.join(ROOT, 'public', 'protocols')
  if (fs.existsSync(publicDir)) {
    const entries = fs.readdirSync(publicDir, { withFileTypes: true })
    entries.forEach((entry) => {
      const resolved = path.join(publicDir, entry.name)
      if (!entry.isFile()) return
      const ext = path.extname(entry.name).toLowerCase()
      const slug = path.basename(entry.name, ext)
      if (ext === '.json') {
        const data = readJsonFile<Record<string, any>>(resolved)
        if (!data) return
        const project = projects[slug] ?? {
          slug,
          name: data.name ?? slug,
          chains: data.chains ?? [],
          tags: [],
          links: [],
          description: data.description ?? '',
          resources: [],
        }
        project.name = project.name || data.name || slug
        project.description = project.description || data.description || ''
        project.chains = project.chains.length ? project.chains : data.chains ?? []
        if (data.category) project.tags = Array.from(new Set([...project.tags, data.category]))
        projects[slug] = project
      } else {
        const project = projects[slug]
        if (project) {
          project.resources.push({
            title: entry.name,
            href: `/${path
              .relative(path.join(ROOT, 'public'), resolved)
              .split(path.sep)
              .join('/')}`,
            type: ext.replace('.', ''),
          })
        }
      }
    })
  }

  const resourceIndex = buildResourcesIndex()
  const docsIndex = buildDocsIndex()
  Object.values(projects).forEach((project) => {
    const related = resourceIndex.filter((resource) => resource.protocol === project.slug)
    related.forEach((resource) => {
      project.resources.push({
        title: resource.title,
        href: resource.href,
        type: 'pdf',
      })
    })
    const relatedDocs = docsIndex.filter((doc) => doc.slug.includes(project.slug))
    relatedDocs.forEach((doc) => {
      project.resources.push({
        title: doc.title,
        href: doc.path,
        type: 'doc',
      })
    })
  })

  return Object.values(projects)
}

export function buildSearchIndex(
  docs: DocRecord[],
  resources: ResourceRecord[],
  projects: ProjectRecord[]
): SearchRecord[] {
  const docEntries = docs.map((doc) => ({
    title: doc.title,
    tags: [doc.section],
    summary: doc.summary,
    href: doc.path,
    kind: 'doc' as const,
  }))
  const resourceEntries = resources.map((resource) => ({
    title: resource.title,
    tags: [resource.category ?? 'resource', ...resource.tags],
    summary: resource.protocol,
    href: resource.href,
    kind: 'resource' as const,
  }))
  const projectEntries = projects.map((project) => ({
    title: project.name,
    tags: project.tags,
    summary: project.description,
    href: `/protocols/${project.slug}`,
    kind: 'project' as const,
  }))
  return [...docEntries, ...resourceEntries, ...projectEntries]
}

export function readIndexFile<T>(filename: string, fallback?: () => T): T {
  const fullPath = path.join(CONTENT_INDEX_DIR, filename)
  if (isFileSync(fullPath)) {
    const data = readJsonFile<T>(fullPath)
    if (data) return data
  }
  if (fallback) {
    return fallback()
  }
  return [] as T
}

export function loadDocsIndex() {
  return readIndexFile<DocRecord[]>('docs.json', buildDocsIndex)
}

export function loadResourcesIndex() {
  return readIndexFile<ResourceRecord[]>('resources.json', buildResourcesIndex)
}

export function loadProjectsIndex() {
  return readIndexFile<ProjectRecord[]>('projects.json', buildProjectsIndex)
}

export function loadSearchIndex() {
  return readIndexFile<SearchRecord[]>('search.json', () =>
    buildSearchIndex(buildDocsIndex(), buildResourcesIndex(), buildProjectsIndex())
  )
}
