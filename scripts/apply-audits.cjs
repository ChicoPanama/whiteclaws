#!/usr/bin/env node
'use strict'

/*
  Applies data/audit_enrichment.json into:
  - lib/data/audits.ts (appends new AuditEntry rows)
  - public/protocols/{slug}.json (adds audits[], audit_count, last_audited, auditors[])

  IMPORTANT: audits.ts entries must match AuditEntry exactly (7 fields only).
*/

const fs = require('fs')
const path = require('path')

const ENRICH_PATH = path.join('data', 'audit_enrichment.json')
const AUDITS_TS_PATH = path.join('lib', 'data', 'audits.ts')
const PROTOCOL_DIR = path.join('public', 'protocols')

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n')
}

function esc(s) {
  return String(s || '').replace(/'/g, "\\'")
}

function toDateKey(d) {
  const s = String(d || '')
  const m = s.match(/\b(20\d{2})-(\d{2})\b/)
  if (m) return `${m[1]}-${m[2]}`
  const y = s.match(/\b(20\d{2})\b/)
  if (y) return y[1]
  return ''
}

function pickLastAudited(dates) {
  const keys = dates.map(toDateKey).filter(Boolean).sort()
  return keys.length ? keys[keys.length - 1] : ''
}

function updateAuditsTs(newEntries) {
  const src = fs.readFileSync(AUDITS_TS_PATH, 'utf8')
  const existingIds = new Set()
  for (const m of src.matchAll(/id:\s*'([^']+)'/g)) existingIds.add(m[1])

  const toAdd = newEntries.filter(e => !existingIds.has(e.id))
  if (!toAdd.length) return { added: 0 }

  const lines = toAdd.map(e => {
    return `  { id: '${esc(e.id)}', title: '${esc(e.title)}', protocol: '${esc(e.protocol)}', auditor: '${esc(e.auditor)}', date: '${esc(e.date)}', pdfPath: '${esc(e.pdfPath)}', category: '${esc(e.category)}' },`
  })

  const insert = '\n' + lines.join('\n') + '\n'

  const re = /\n\]\s*\n\n\/\/ Stats computed from catalog/m
  if (!re.test(src)) throw new Error(`Could not find auditCatalog array terminator in ${AUDITS_TS_PATH}`)

  const next = src.replace(re, `${insert}]\n\n// Stats computed from catalog`)
  fs.writeFileSync(AUDITS_TS_PATH, next)
  return { added: toAdd.length }
}

function applyToProtocolJsons(enrichment) {
  let updated = 0
  for (const [slug, p] of Object.entries(enrichment.protocols || {})) {
    const audits = p?.audits || []
    if (!audits.length) continue

    const file = path.join(PROTOCOL_DIR, `${slug}.json`)
    if (!fs.existsSync(file)) continue

    const proto = JSON.parse(fs.readFileSync(file, 'utf8'))
    const existing = Array.isArray(proto.audits) ? proto.audits : []
    const byId = new Map(existing.map(a => [a.id, a]))

    for (const a of audits) {
      const pdf = a.pdf_url || a.source_url || ''
      byId.set(a.id, {
        id: a.id,
        title: a.title || '',
        auditor: a.auditor || '',
        date: a.date || '',
        pdf_url: pdf,
      })
    }

    const merged = Array.from(byId.values()).sort((a, b) => (toDateKey(a.date) || '').localeCompare(toDateKey(b.date) || ''))
    const auditors = Array.from(new Set(merged.map(a => a.auditor).filter(Boolean))).sort()
    const lastAudited = pickLastAudited(merged.map(a => a.date))

    proto.audits = merged
    proto.audit_count = merged.length
    proto.last_audited = lastAudited
    proto.auditors = auditors

    writeJson(file, proto)
    updated++
  }
  return { updated }
}

function main() {
  if (!fs.existsSync(ENRICH_PATH)) {
    console.error(`Missing ${ENRICH_PATH}. Run: node scripts/enrich-audits.cjs`)
    process.exit(1)
  }

  const enrichment = readJson(ENRICH_PATH)

  const newCatalogEntries = []
  for (const p of Object.values(enrichment.protocols || {})) {
    const protoName = p?.name || p?.slug || ''
    for (const a of p?.audits || []) {
      const category = a.category || 'DeFi'
      newCatalogEntries.push({
        id: a.id,
        title: a.title || '',
        protocol: protoName,
        auditor: a.auditor || '',
        date: a.date || '',
        pdfPath: a.pdf_url || a.source_url || '',
        category,
      })
    }
  }

  const { added } = updateAuditsTs(newCatalogEntries)
  const { updated } = applyToProtocolJsons(enrichment)

  console.log(`Updated ${AUDITS_TS_PATH}: +${added} entries`)
  console.log(`Updated protocol JSONs: ${updated}`)
}

main()

