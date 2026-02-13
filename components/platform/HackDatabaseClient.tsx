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
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [groupBy, setGroupBy] = useState<GroupBy>('auditor')

  const categories = useMemo(() => {
    const cats = Array.from(new Set(audits.map(a => a.category))).sort()
    return ['all', ...cats]
  }, [audits])

  const filtered = useMemo(() => {
    let list = [...audits]

    // search
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

    // category filter
    if (categoryFilter !== 'all') {
      list = list.filter(a => a.category === categoryFilter)
    }

    // sort
    list.sort((a, b) => {
      if (sortField === 'date') {
        return b.date.localeCompare(a.date)
      }
      if (sortField === 'protocol') {
        return a.protocol.localeCompare(b.protocol)
      }
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
    // Sort groups by count descending
    const sorted = Object.entries(map).sort((a, b) => b[1].length - a[1].length)
    return Object.fromEntries(sorted)
  }, [filtered, groupBy])

  return (
    <div className="hd-root">
      {/* Stats */}
      <div className="hd-stats">
        <div className="hd-stat">
          <span className="hd-stat-val">{stats.total}</span>
          <span className="hd-stat-label">Audit Reports</span>
        </div>
        <div className="hd-stat">
          <span className="hd-stat-val">{stats.protocols}</span>
          <span className="hd-stat-label">Protocols Covered</span>
        </div>
        <div className="hd-stat">
          <span className="hd-stat-val">{stats.auditors}</span>
          <span className="hd-stat-label">Auditors</span>
        </div>
        <div className="hd-stat">
          <span className="hd-stat-val">{research.length}</span>
          <span className="hd-stat-label">Research Docs</span>
        </div>
      </div>

      {/* Exploit Research */}
      <div className="hd-section-label">Exploit Research</div>
      <div className="hd-research-grid">
        {research.map(r => (
          <a key={r.id} href={r.link} className="hd-research-card">
            <div className="hd-research-header">
              <span className="hd-research-icon">{r.icon}</span>
              <span className="hd-research-title">{r.title}</span>
            </div>
            <p className="hd-research-desc">{r.description}</p>
            <div className="hd-research-tags">
              <span className="hd-tag">{r.category}</span>
              {r.chains.map(c => (
                <span key={c} className="hd-tag">{c}</span>
              ))}
              <span className="hd-tag accent">{r.bountyValue}</span>
            </div>
          </a>
        ))}
      </div>

      {/* Controls */}
      <div className="hd-section-label">
        Audit Report Library
        <span className="hd-count">{filtered.length} reports</span>
      </div>

      <div className="hd-controls">
        <div className="hd-search-wrap">
          <svg className="hd-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="hd-search"
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="hd-control-row">
          <div className="hd-filter-tabs">
            {categories.map(cat => (
              <button
                key={cat}
                className={`hd-filter-tab ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          <div className="hd-sort-group">
            <label className="hd-sort-label">Sort</label>
            <select
              className="hd-select"
              value={sortField}
              onChange={e => setSortField(e.target.value as SortField)}
            >
              <option value="date">Date (Newest)</option>
              <option value="protocol">Protocol</option>
              <option value="auditor">Auditor</option>
            </select>

            <label className="hd-sort-label">Group</label>
            <select
              className="hd-select"
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as GroupBy)}
            >
              <option value="auditor">By Auditor</option>
              <option value="protocol">By Protocol</option>
              <option value="category">By Category</option>
              <option value="none">No Grouping</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grouped Audit Cards */}
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
            <div className="hd-audit-grid">
              {entries.map(a => (
                <a
                  key={a.id}
                  href={a.pdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hd-audit-card"
                >
                  <div className="hd-audit-top">
                    <span className="hd-audit-protocol">{a.protocol}</span>
                    <span className="hd-audit-date">{a.date}</span>
                  </div>
                  <div className="hd-audit-title">{a.title}</div>
                  <div className="hd-audit-bottom">
                    <span className="hd-tag">{a.category}</span>
                    <span className="hd-audit-auditor">by {a.auditor}</span>
                  </div>
                  <div className="hd-audit-dl">
                    <span>Download PDF</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 17l9.2-9.2M17 17V7.8M17 7.8H7.8" />
                    </svg>
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
