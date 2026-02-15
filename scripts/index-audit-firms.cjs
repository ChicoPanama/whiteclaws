#!/usr/bin/env node
'use strict'

/*
  Builds a master index of public audit reports from:
  - GitHub-hosted audit firm repos (PDF discovery via Contents API)
  - GitHub orgs for contest platforms (Sherlock, Code4rena)
  - Firm websites (best-effort static HTML scraping; skips JS-rendered pages)

  Notes:
  - Do NOT hardcode secrets. For GitHub API auth, set GITHUB_TOKEN in env.
  - Checkpointed after each firm to support resume.
*/

const fs = require('fs')
const path = require('path')

const OUT_PATH = path.join('data', 'audit_firm_index.json')
const CHECKPOINT_PATH = path.join('data', '.firm_index_checkpoint.json')

const USER_AGENT =
  'WhiteClaws-SecurityBot/1.0 (security research; contact: security@whiteclaws.xyz)'

const GITHUB_API = 'https://api.github.com'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || ''

const GITHUB_FIRMS = [
  { slug: 'trail-of-bits', name: 'Trail of Bits', owner: 'trailofbits', repo: 'publications', paths: ['reviews'] },
  { slug: 'cyfrin', name: 'Cyfrin', owner: 'Cyfrin', repo: 'cyfrin-audit-reports', paths: ['reports'] },
  { slug: 'spearbit', name: 'Spearbit', owner: 'spearbit', repo: 'portfolio', paths: ['pdfs'] },
  { slug: 'peckshield', name: 'PeckShield', owner: 'peckshield', repo: 'publications', paths: ['audit_reports'] },
  { slug: 'halborn', name: 'Halborn', owner: 'HalbornSecurity', repo: 'PublicReports', paths: [''] },
  // Placeholder from task spec. Repo unknown; skip gracefully.
  { slug: 'oak-security', name: 'Oak Security', owner: '', repo: '', paths: [] },
]

const WEB_FIRMS = [
  { slug: 'zellic', name: 'Zellic', url: 'https://zellic.io/audits' },
  { slug: 'openzeppelin', name: 'OpenZeppelin', url: 'https://blog.openzeppelin.com/tag/security-audits' },
  { slug: 'consensys-diligence', name: 'Consensys Diligence', url: 'https://consensys.io/diligence/audits/' },
  { slug: 'least-authority', name: 'Least Authority', url: 'https://leastauthority.com/security-consulting/published-audits/' },
  { slug: 'certik', name: 'CertiK', url: 'https://skynet.certik.com/' },
  { slug: 'quantstamp', name: 'Quantstamp', url: 'https://certificate.quantstamp.com/' },
  { slug: 'hacken', name: 'Hacken', url: 'https://hacken.io/audits/' },
  { slug: 'mixbytes', name: 'MixBytes', url: 'https://mixbytes.io/' },
  { slug: 'slowmist', name: 'SlowMist', url: 'https://github.com/AuditReports/slowmist-audit' },
  { slug: 'chainsecurity', name: 'ChainSecurity', url: 'https://chainsecurity.com/smart-contract-audit-reports/' },
  { slug: 'dedaub', name: 'Dedaub', url: 'https://dedaub.com/audits' },
  { slug: 'nethermind', name: 'Nethermind', url: 'https://www.nethermind.io/smart-contract-audits' },
  { slug: 'ottersec', name: 'OtterSec', url: 'https://osec.io/audits' },
  { slug: 'hexens', name: 'Hexens', url: 'https://hexens.io/audits' },
]

const CONTEST_PLATFORMS = [
  { slug: 'code4rena-web', name: 'Code4rena', url: 'https://code4rena.com/reports' },
  { slug: 'cantina', name: 'Cantina', url: 'https://cantina.xyz/portfolio' },
  { slug: 'hats-finance', name: 'Hats Finance', url: 'https://app.hats.finance/audit-competitions' },
]

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithTimeout(url, { headers = {}, timeoutMs = 15000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { headers, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

let lastRequestAt = 0
async function politeFetch(url, { headers = {}, timeoutMs = 15000, minDelayMs = 2000 } = {}) {
  const now = Date.now()
  const wait = Math.max(0, lastRequestAt + minDelayMs - now)
  if (wait) await sleep(wait)
  lastRequestAt = Date.now()
  return fetchWithTimeout(url, { headers, timeoutMs })
}

function githubHeaders() {
  const h = {
    'User-Agent': USER_AGENT,
    Accept: 'application/vnd.github.v3+json',
  }
  if (GITHUB_TOKEN) h.Authorization = `token ${GITHUB_TOKEN}`
  return h
}

async function githubJson(urlPath) {
  const url = urlPath.startsWith('http') ? urlPath : `${GITHUB_API}${urlPath}`
  const res = await politeFetch(url, { headers: githubHeaders(), minDelayMs: 2000 })
  if (res.status === 404) return { ok: false, status: 404, data: null }
  const text = await res.text()
  if (!res.ok) return { ok: false, status: res.status, data: { message: text.slice(0, 500) } }
  return { ok: true, status: res.status, data: JSON.parse(text) }
}

function parseLinkHeader(link) {
  // <url>; rel="next", <url>; rel="last"
  const out = {}
  if (!link) return out
  for (const part of link.split(',')) {
    const m = part.match(/<([^>]+)>;\s*rel=\"([^\"]+)\"/)
    if (m) out[m[2]] = m[1]
  }
  return out
}

async function listOrgRepos(org) {
  let url = `${GITHUB_API}/orgs/${org}/repos?per_page=100`
  const repos = []
  while (url) {
    const res = await politeFetch(url, { headers: githubHeaders(), minDelayMs: 2000 })
    if (!res.ok) {
      const t = await res.text()
      return { ok: false, status: res.status, error: t.slice(0, 500), repos: [] }
    }
    const page = await res.json()
    repos.push(...page)
    const links = parseLinkHeader(res.headers.get('link'))
    url = links.next || ''
  }
  return { ok: true, repos }
}

function extractDate(s) {
  if (!s) return ''
  const m1 = s.match(/\b(20\d{2})[-_/](\d{2})(?:[-_/](\d{2}))?\b/)
  if (m1) return `${m1[1]}-${m1[2]}`
  const m2 = s.match(/\b(Q[1-4])\s*(20\d{2})\b/i)
  if (m2) return `${m2[2]}-${m2[1].toUpperCase()}`
  const m3 = s.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+(20\d{2})\b/i)
  if (m3) return `${m3[2]}-${m3[1].slice(0, 3)}`
  return ''
}

function extractName(s) {
  if (!s) return ''
  const base = s.replace(/\.pdf$/i, '')
  const cleaned = base
    .replace(/\b(20\d{2})[-_/]\d{2}(?:[-_/]\d{2})?\b/g, ' ')
    .replace(/\bsecurity\s*review\b/gi, ' ')
    .replace(/\baud(it|its)\b/gi, ' ')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.toLowerCase()
}

async function listPdfsViaContents(owner, repo, startPath) {
  const out = []
  async function walk(p) {
    const encoded = p.split('/').filter(Boolean).map(encodeURIComponent).join('/')
    const apiPath = `/repos/${owner}/${repo}/contents/${encoded}`
    const r = await githubJson(apiPath)
    if (!r.ok) return
    if (!Array.isArray(r.data)) return
    for (const item of r.data) {
      if (item.type === 'dir') await walk(item.path)
      if (item.type === 'file' && /\.pdf$/i.test(item.name) && item.download_url) {
        out.push({
          filename: item.name,
          url: item.download_url,
          date_extracted: extractDate(item.name),
          name_extracted: extractName(item.name),
        })
      }
    }
  }
  await walk(startPath || '')
  return out
}

function isProbablyJsRendered(html) {
  if (!html) return false
  const s = html.slice(0, 20000).toLowerCase()
  const hasBodyText = s.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '').trim().length > 200
  if (hasBodyText) return false
  return s.includes('id="__next"') || s.includes('data-reactroot') || s.includes('window.__') || s.includes('hydrate')
}

function extractAnchorLinks(html) {
  const links = []
  if (!html) return links
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let m
  while ((m = re.exec(html))) {
    const href = m[1]
    const text = (m[2] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    links.push({ href, text })
  }
  return links
}

function absolutize(base, href) {
  try {
    return new URL(href, base).toString()
  } catch {
    return href
  }
}

async function scrapeListing(url) {
  const headers = {
    'User-Agent': USER_AGENT,
    Accept: 'text/html,application/xhtml+xml,*/*',
  }
  const res = await politeFetch(url, { headers, minDelayMs: 2000 })
  const status = res.status
  const html = await res.text()
  if (status === 403) return { status: '403_blocked', reports: [], note: '403 blocked' }
  if (status === 404) return { status: '404_not_found', reports: [], note: '404 not found' }
  if (!res.ok) return { status: `http_${status}`, reports: [], note: html.slice(0, 200) }

  if (isProbablyJsRendered(html)) {
    return { status: 'js_rendered_skipped', reports: [], note: 'JS-rendered (no useful static HTML found)' }
  }

  const anchors = extractAnchorLinks(html)
  const pdfs = []
  for (const a of anchors) {
    const href = absolutize(url, a.href)
    if (/\.pdf(\?|#|$)/i.test(href)) {
      pdfs.push({
        title: a.text || path.basename(href),
        url: url,
        pdf_url: href,
        date_extracted: extractDate(a.text) || extractDate(href),
        name_extracted: extractName(a.text) || extractName(href),
      })
    } else if (/\baudits?\b|\bsecurity\b/i.test(a.text || '') || /\/audit|\/audits|security/i.test(href)) {
      pdfs.push({
        title: a.text || path.basename(href),
        url: href,
        pdf_url: '',
        date_extracted: extractDate(a.text) || extractDate(href),
        name_extracted: extractName(a.text) || extractName(href),
      })
    }
  }
  return { status: 'success', reports: pdfs, note: '' }
}

function loadCheckpoint() {
  try {
    return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf8'))
  } catch {
    return null
  }
}

function writeCheckpoint(obj) {
  fs.mkdirSync(path.dirname(CHECKPOINT_PATH), { recursive: true })
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(obj, null, 2))
}

async function main() {
  const args = new Set(process.argv.slice(2))
  const resume = args.has('--resume')

  const checkpoint = resume ? loadCheckpoint() : null
  const result = checkpoint?.result || {
    indexed_at: new Date().toISOString(),
    total_reports: 0,
    total_firms: 0,
    firms: {},
    failures: {},
  }
  const done = new Set(checkpoint?.done || [])

  async function markDone(slug) {
    done.add(slug)
    writeCheckpoint({ done: Array.from(done), result })
  }

  // GitHub firm repos (PDF discovery)
  for (const firm of GITHUB_FIRMS) {
    if (done.has(firm.slug)) continue

    if (!firm.owner || !firm.repo) {
      result.failures[firm.slug] = { status: 'skipped', note: 'Missing owner/repo in config' }
      await markDone(firm.slug)
      continue
    }

    const sourceUrl = `https://github.com/${firm.owner}/${firm.repo}`
    const firmEntry = {
      name: firm.name,
      source_type: 'github',
      source_url: sourceUrl,
      status: 'pending',
      reports: [],
    }
    result.firms[firm.slug] = firmEntry

    try {
      const reports = []
      for (const p of firm.paths) {
        const found = await listPdfsViaContents(firm.owner, firm.repo, p)
        reports.push(...found)
      }
      firmEntry.reports = reports
      firmEntry.status = 'success'
    } catch (e) {
      firmEntry.status = 'error'
      result.failures[firm.slug] = { status: 'error', note: String(e?.message || e) }
    }

    await markDone(firm.slug)
  }

  // Sherlock org repos
  if (!done.has('sherlock')) {
    const slug = 'sherlock'
    const firmEntry = {
      name: 'Sherlock',
      source_type: 'github_org',
      source_url: 'https://github.com/sherlock-audit',
      status: 'pending',
      reports: [],
    }
    result.firms[slug] = firmEntry
    try {
      const r = await listOrgRepos('sherlock-audit')
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.error}`)
      firmEntry.reports = r.repos.map(repo => {
        const name = repo.name || ''
        const m = name.match(/^(\d{4}-\d{2})-(.+?)-(audit|judging)\b/i)
        const m2 = name.match(/^(.+?)-(audit|judging)\b/i)
        const date_extracted = m ? m[1] : extractDate(name)
        const name_extracted = (m ? m[2] : m2 ? m2[1] : '').toLowerCase()
        return { repo_name: name, url: repo.html_url, date_extracted, name_extracted }
      })
      firmEntry.status = 'success'
    } catch (e) {
      firmEntry.status = 'error'
      result.failures[slug] = { status: 'error', note: String(e?.message || e) }
    }
    await markDone(slug)
  }

  // Code4rena org repos
  if (!done.has('code4rena')) {
    const slug = 'code4rena'
    const firmEntry = {
      name: 'Code4rena',
      source_type: 'github_org',
      source_url: 'https://github.com/code-423n4',
      status: 'pending',
      reports: [],
    }
    result.firms[slug] = firmEntry
    try {
      const r = await listOrgRepos('code-423n4')
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.error}`)
      firmEntry.reports = r.repos.map(repo => {
        const name = repo.name || ''
        const m = name.match(/^(\d{4}-\d{2})-(.+?)-findings\b/i)
        const date_extracted = m ? m[1] : extractDate(name)
        const name_extracted = (m ? m[2] : '').toLowerCase()
        return { repo_name: name, url: repo.html_url, date_extracted, name_extracted }
      })
      firmEntry.status = 'success'
    } catch (e) {
      firmEntry.status = 'error'
      result.failures[slug] = { status: 'error', note: String(e?.message || e) }
    }
    await markDone(slug)
  }

  // Web firm listings
  for (const firm of WEB_FIRMS) {
    if (done.has(firm.slug)) continue
    const firmEntry = {
      name: firm.name,
      source_type: 'website',
      source_url: firm.url,
      status: 'pending',
      reports: [],
    }
    result.firms[firm.slug] = firmEntry
    try {
      // If the "website" is a GitHub repo page, best-effort treat as website scrape (static HTML).
      const scraped = await scrapeListing(firm.url)
      firmEntry.status = scraped.status
      firmEntry.reports = scraped.reports
      if (scraped.status !== 'success') {
        result.failures[firm.slug] = { status: scraped.status, note: scraped.note || '' }
      }
    } catch (e) {
      firmEntry.status = 'error'
      result.failures[firm.slug] = { status: 'error', note: String(e?.message || e) }
    }
    await markDone(firm.slug)
  }

  // Contest platforms (web)
  for (const p of CONTEST_PLATFORMS) {
    if (done.has(p.slug)) continue
    const firmEntry = {
      name: p.name,
      source_type: 'contest_platform',
      source_url: p.url,
      status: 'pending',
      reports: [],
    }
    result.firms[p.slug] = firmEntry
    try {
      const scraped = await scrapeListing(p.url)
      firmEntry.status = scraped.status
      firmEntry.reports = scraped.reports
      if (scraped.status !== 'success') {
        result.failures[p.slug] = { status: scraped.status, note: scraped.note || '' }
      }
    } catch (e) {
      firmEntry.status = 'error'
      result.failures[p.slug] = { status: 'error', note: String(e?.message || e) }
    }
    await markDone(p.slug)
  }

  // Solodit (aggregator) is typically JS-rendered; record as skipped for now.
  if (!result.failures.solodit) {
    result.failures.solodit = { status: 'js_rendered_skipped', note: 'SPA, requires browser/JS or API discovery' }
  }

  // Final counts
  let totalReports = 0
  for (const v of Object.values(result.firms)) totalReports += (v.reports || []).length
  result.total_reports = totalReports
  result.total_firms = Object.keys(result.firms).length
  result.indexed_at = new Date().toISOString()

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2))
  writeCheckpoint({ done: Array.from(done), result })

  console.log(`Wrote ${OUT_PATH} (${result.total_firms} firms, ${result.total_reports} reports)`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

