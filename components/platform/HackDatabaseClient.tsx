'use client'

import { useState, useMemo } from 'react'

interface AuditEntry {
  id: string
  title: string
  protocol: string
  auditor: string
  date: string
  pdfPath: string
  category: string
}

interface ResearchDoc {
  id: string
  title: string
  category: string
  bountyValue: string
  description: string
  link: string
  icon: string
  chains: string[]
  findings: number | string
  date: string
}

type SortField = 'date' | 'protocol' | 'auditor'
type GroupBy = 'none' | 'auditor' | 'protocol' | 'category'

export default function HackDatabaseClient({
  audits,
  research,
  stats,
}: {
  audits: AuditEntry[]
  research: ResearchDoc[]
  stats: { total: number; protocols: number; auditors: number; categories: string[] }
}) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sortField, setSortField] = useState<SortField>('date')
  const [groupBy, setGroupBy] = useState<GroupBy>('auditor')

  const CATEGORIES = useMemo(() => {
    const cats = Array.from(new Set(audits.map(a => a.category))).sort()
    return ['All', ...cats]
  }, [audits])

  const SORT_OPTIONS: { label: string; key: SortField }[] = [
    { label: 'Newest', key: 'date' },
    { label: 'Protocol', key: 'protocol' },
    { label: 'Auditor', key: 'auditor' },
  ]

  const GROUP_OPTIONS: { label: string; key: GroupBy }[] = [
    { label: 'By Auditor', key: 'auditor' },
    { label: 'By Protocol', key: 'protocol' },
    { label: 'By Category', key: 'category' },
    { label: 'None', key: 'none' },
  ]

  const filtered = useMemo(() => {
    let list = [...audits]

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        a =>
          a.title.toLowerCase().includes(q) ||
          a.protocol.toLowerCase().includes(q) ||
          a.auditor.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      )
    }

    if (categoryFilter !== 'All') {
      list = list.filter(a => a.category === categoryFilter)
    }

    list.sort((a, b) => {
      if (sortField === 'date') return b.date.localeCompare(a.date)
      if (sortField === 'protocol') return a.protocol.localeCompare(b.protocol)
      return a.auditor.localeCompare(b.auditor)
    })

    return list
  }, [audits, search, categoryFilter, sortField])

  const grouped = useMemo(() => {
    if (groupBy === 'none') return { '': filtered }
    const map: Record<string, AuditEntry[]> = {}
    for (const a of filtered) {
      const key = groupBy === 'auditor' ? a.auditor : groupBy === 'protocol' ? a.protocol : a.category
      if (!map[key]) map[key] = []
      map[key].push(a)
    }
    const sorted = Object.entries(map).sort((a, b) => b[1].length - a[1].length)
    return Object.fromEntries(sorted)
  }, [filtered, groupBy])

  return (
    <div className="hd-root">
      {/* ─── Stats Bar ─── */}
      <div className="bg-hero-stats">
        <div className="bg-hero-stat">
          <span className="bg-hero-stat-value">{stats.total}</span>
          <span className="bg-hero-stat-label">Audit Reports</span>
        </div>
        <div className="bg-hero-stat">
          <span className="bg-hero-stat-value">{stats.protocols}</span>
          <span className="bg-hero-stat-label">Protocols</span>
        </div>
        <div className="bg-hero-stat">
          <span className="bg-hero-stat-value">{stats.auditors}</span>
          <span className="bg-hero-stat-label">Auditors</span>
        </div>
        <div className="bg-hero-stat">
          <span className="bg-hero-stat-value">{research.length}</span>
          <span className="bg-hero-stat-label">Research Docs</span>
        </div>
      </div>

      {/* ─── Exploit Research Grid ─── */}
      <div className="hd-section-label">Exploit Research</div>
      <div className="bg-grid" style={{ marginBottom: 36 }}>
        {research.map(r => (
          <a key={r.id} href={r.link} className="bg-card ob-link-reset">
            {/* Header */}
            <div className="bg-card-head">
              <div className="bg-card-icon">
                <span style={{ fontSize: '1.2rem' }}>{r.icon}</span>
              </div>
              <div className="bg-card-title">
                <span className="bg-card-name">{r.title}</span>
                <span className="bg-card-cat">{r.category}</span>
              </div>
              <div className="bg-card-reward">
                <span className="bg-card-reward-label">Bounty Range</span>
                <span className="bg-card-reward-value">{r.bountyValue}</span>
              </div>
            </div>

            {/* Description */}
            <p className="bg-card-desc">
              {r.description.length > 140 ? r.description.slice(0, 140) + '...' : r.description}
            </p>

            {/* Badges */}
            <div className="bg-card-badges">
              {r.chains.map(c => (
                <span key={c} className="bg-badge chain">{c}</span>
              ))}
              <span className="bg-badge poc">{r.findings} finding{r.findings !== 1 ? 's' : ''}</span>
              <span className="bg-badge token">{r.date}</span>
            </div>

            {/* Footer */}
            <div className="bg-card-footer">
              <span className="bg-card-stat">{r.category}</span>
              <span className="bg-card-arrow">Read Research →</span>
            </div>
          </a>
        ))}
      </div>

      {/* ─── Search + Controls ─── */}
      <div className="hd-section-label">
        Audit Report Library
        <span className="hd-count">{filtered.length} reports</span>
      </div>

      <div className="bg-search-bar">
        <input
          type="text"
          placeholder="Search protocols, auditors, categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-search-input"
        />
        <span className="bg-result-count">{filtered.length} reports</span>
      </div>

      <div className="bg-controls">
        <div className="bfs">
          {CATEGORIES.map(f => (
            <button
              key={f}
              type="button"
              className={`bf ${f === categoryFilter ? 'active' : ''}`}
              onClick={() => setCategoryFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="bg-sort">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              className={`bg-sort-btn ${sortField === opt.key ? 'active' : ''}`}
              onClick={() => setSortField(opt.key)}
            >
              {opt.label}
            </button>
          ))}
          <span style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
          {GROUP_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              className={`bg-sort-btn ${groupBy === opt.key ? 'active' : ''}`}
              onClick={() => setGroupBy(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Grouped Audit Cards ─── */}
      {filtered.length === 0 ? (
        <div className="hd-empty">No reports match your search.</div>
      ) : (
        Object.entries(grouped).map(([groupName, entries]) => (
          <div key={groupName} className="hd-group">
            {groupName && (
              <div className="hd-group-header">
                <span className="hd-group-name">{groupName}</span>
                <span className="hd-group-count">{entries.length} report{entries.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="bg-grid">
              {entries.map(a => (
                <a
                  key={a.id}
                  href={a.pdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-card ob-link-reset"
                >
                  {/* Header */}
                  <div className="bg-card-head">
                    <div className="bg-card-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--dim)' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div className="bg-card-title">
                      <span className="bg-card-name">{a.protocol}</span>
                      <span className="bg-card-cat">{a.auditor}</span>
                    </div>
                    <div className="bg-card-reward">
                      <span className="bg-card-reward-label">Date</span>
                      <span className="bg-card-reward-value" style={{ fontSize: '.88rem' }}>{a.date}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <p className="bg-card-desc">{a.title}</p>

                  {/* Badges */}
                  <div className="bg-card-badges">
                    <span className="bg-badge chain">{a.category}</span>
                    <span className="bg-badge token">{a.auditor}</span>
                  </div>

                  {/* Footer */}
                  <div className="bg-card-footer">
                    <span className="bg-card-stat">PDF Report</span>
                    <span className="bg-card-arrow">Download ↗</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
