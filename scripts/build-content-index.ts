const fs = require('fs')
const path = require('path')
const {
  buildDocsIndex,
  buildResourcesIndex,
  buildProjectsIndex,
  buildSearchIndex,
} = require('../lib/content/fsIndexBase')

const root = process.cwd()
const outDir = path.join(root, 'content-index')

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

const docs = buildDocsIndex()
const resources = buildResourcesIndex()
const projects = buildProjectsIndex()
const search = buildSearchIndex(docs, resources, projects)

fs.writeFileSync(path.join(outDir, 'docs.json'), JSON.stringify(docs, null, 2))
fs.writeFileSync(path.join(outDir, 'resources.json'), JSON.stringify(resources, null, 2))
fs.writeFileSync(path.join(outDir, 'projects.json'), JSON.stringify(projects, null, 2))
fs.writeFileSync(path.join(outDir, 'search.json'), JSON.stringify(search, null, 2))

console.log('Content index generated:', outDir)
