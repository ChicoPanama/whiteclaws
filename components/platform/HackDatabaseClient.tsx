'use client'

import { useState, useMemo } from 'react'

interface AuditEntry {
  id: string
  title: string
  protocol: string
  protocol_slug: string
  auditor: string
  date: string
  pdfPath: string
  category: string
  chains: string[]
  primitive: string
  version?: string
  fork_family?: string
  findings_summary?: {
    critical: number
    high: number
    medium: number
    low: number
    informational: number
  }
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
  stats: { total: number; protocols: number; auditors: number; categories: string[]; chains: number; primitives: number }
}) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [chainFilter, setChainFilter] = useState('All')
  const [primitiveFilter, setPrimitiveFilter] = useState('All')
  const [auditorFilter, setAuditorFilter] = useState('All')
  const [sortField, setSortField] = useState<SortField>('date')
  const [groupBy, setGroupBy] = useState<GroupBy>('protocol')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const CATEGORIES = useMemo(() => {
    const cats = Array.from(new Set(audits.map(a => a.category))).sort()
    return ['All', ...cats]
  }, [audits])

  const CHAINS = useMemo(() => {
    const c = Array.from(new Set(audits.flatMap(a => a.chains))).sort()
    return ['All', ...c]
  }, [audits])

  const PRIMITIVES = useMemo(() => {
    const p = Array.from(new Set(audits.map(a => a.primitive))).sort()
    return ['All', ...p]
  }, [audits])

  const AUDITORS = useMemo(() => {
    const a = Array.from(new Set(audits.map(a => a.auditor))).sort()
    return ['All', ...a]
  }, [audits])

  const SORT_OPTIONS: { label: string; key: SortField }[] = [
    { label: 'Newest', key: 'date' },
    { label: 'Protocol', key: 'protocol' },
    { label: 'Auditor', key: 'auditor' },
  ]

  const GROUP_OPTIONS: { label: string; key: GroupBy }[] = [
    { label: 'By Protocol', key: 'protocol' },
    { label: 'By Auditor', key: 'auditor' },
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
          a.category.toLowerCase().includes(q) ||
          a.primitive.toLowerCase().includes(q) ||
          a.chains.some(c => c.toLowerCase().includes(q))
      )
    }

    if (categoryFilter !== 'All') {
      list = list.filter(a => a.category === categoryFilter)
    }
    if (chainFilter !== 'All') {
      list = list.filter(a => a.chains.includes(chainFilter))
    }
    if (primitiveFilter !== 'All') {
      list = list.filter(a => a.primitive === primitiveFilter)
    }
    if (auditorFilter !== 'All') {
      list = list.filter(a => a.auditor === auditorFilter)
    }

    list.sort((a, b) => {
      if (sortField === 'date') return b.date.localeCompare(a.date)
      if (sortField === 'protocol') return a.protocol.localeCompare(b.protocol)
      return a.auditor.localeCompare(b.auditor)
    })

    return list
  }, [audits, search, categoryFilter, chainFilter, primitiveFilter, auditorFilter, sortField])

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

  function toggleGroup(key: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function getDateRange(entries: AuditEntry[]): string {
    const dates = entries.map(e => e.date).sort()
    if (dates.length <= 1) return dates[0] || ''
    const first = formatDateShort(dates[0])
    const last = formatDateShort(dates[dates.length - 1])
    return first === last ? first : `${first} — ${last}`
  }

  function formatDateShort(d: string): string {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const parts = d.split('-')
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10)
      return `${months[m - 1] || parts[1]} ${parts[0]}`
    }
    return d
  }

  const isGrouped = groupBy !== 'none'

  return (
    <div className="hd-root">
      {/* Stats Bar */}
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
          <span className="bg-hero-stat-value">{stats.chains}</span>
          <span className="bg-hero-stat-label">Chains</span>
        </div>
        <div className="bg-hero-stat">
          <span className="bg-hero-stat-value">{stats.primitives}</span>
          <span className="bg-hero-stat-label">Primitives</span>
        </div>
        <div className="bg-hero-stat">
          <span className="bg-hero-stat-value">{research.length}</span>
          <span className="bg-hero-stat-label">Research Docs</span>
        </div>
      </div>

      {/* Exploit Research Grid */}
      <div className="hd-section-label">Exploit Research</div>
      <div className="bg-grid" style={{ marginBottom: 36 }}>
        {research.map(r => (
          <a key={r.id} href={r.link} className="bg-card ob-link-reset">
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
            <p className="bg-card-desc">
              {r.description.length > 140 ? r.description.slice(0, 140) + '...' : r.description}
            </p>
            <div className="bg-card-badges">
              {r.chains.map(c => (
                <span key={c} className="bg-badge chain">{c}</span>
              ))}
              <span className="bg-badge poc">{r.findings} finding{r.findings !== 1 ? 's' : ''}</span>
              <span className="bg-badge token">{r.date}</span>
            </div>
            <div className="bg-card-footer">
              <span className="bg-card-stat">{r.category}</span>
              <span className="bg-card-arrow">Read Research →</span>
            </div>
          </a>
        ))}
      </div>

      {/* Search + Controls */}
      <div className="hd-section-label">
        Audit Report Library
        <span className="hd-count">{filtered.length} reports</span>
      </div>

      <div className="bg-search-bar">
        <input
          type="text"
          placeholder="Search protocols, auditors, chains, primitives..."
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
          {/* Dropdowns for chain, primitive, auditor */}
          <select
            className="hd-select"
            value={chainFilter}
            onChange={e => setChainFilter(e.target.value)}
          >
            {CHAINS.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Chains' : c}</option>
            ))}
          </select>
          <select
            className="hd-select"
            value={primitiveFilter}
            onChange={e => setPrimitiveFilter(e.target.value)}
          >
            {PRIMITIVES.map(p => (
              <option key={p} value={p}>{p === 'All' ? 'All Primitives' : p}</option>
            ))}
          </select>
          <select
            className="hd-select"
            value={auditorFilter}
            onChange={e => setAuditorFilter(e.target.value)}
          >
            {AUDITORS.map(a => (
              <option key={a} value={a}>{a === 'All' ? 'All Auditors' : a}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-controls" style={{ marginTop: 0 }}>
        <div className="bg-sort">
          <span className="hd-sort-label">Sort</span>
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
          <span className="hd-sort-label">Group</span>
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

      {/* Grouped Audit Cards */}
      {filtered.length === 0 ? (
        <div className="hd-empty">No reports match your search.</div>
      ) : isGrouped ? (
        /* Protocol-grouped collapsible sections */
        Object.entries(grouped).map(([groupName, entries]) => {
          const isOpen = expanded.has(groupName)
          const dateRange = getDateRange(entries)
          return (
            <div key={groupName} className="hd-group">
              <button
                type="button"
                className={`audit-group-toggle ${isOpen ? 'open' : ''}`}
                onClick={() => toggleGroup(groupName)}
              >
                <svg className="audit-group-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span className="audit-group-name">{groupName}</span>
                <span className="audit-group-count">{entries.length} report{entries.length !== 1 ? 's' : ''}</span>
                {dateRange && <span className="audit-date-range">{dateRange}</span>}
              </button>

              {isOpen && (
                <div className="audit-timeline">
                  {entries.map((a, i) => (
                    <div key={a.id} className="audit-timeline-item">
                      <div className="audit-timeline-dot" />
                      {i < entries.length - 1 && <div className="audit-timeline-line" />}
                      <a
                        href={a.pdfPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="audit-timeline-card ob-link-reset"
                      >
                        <div className="audit-tc-header">
                          <div className="audit-tc-info">
                            <span className="audit-tc-auditor">{a.auditor}</span>
                            <span className="audit-tc-date">{a.date}</span>
                          </div>
                          <span className={`bg-badge ${a.category === 'DeFi' ? 'chain' : a.category === 'Bridge' ? 'kyc' : a.category === 'L1/L2' ? 'poc' : 'token'}`}>{a.category}</span>
                        </div>
                        <div className="audit-tc-title">{a.title}</div>
                        <div className="audit-tc-meta">
                          <div className="bg-card-badges">
                            {a.chains.map(c => (
                              <span key={c} className="bg-badge chain">{c}</span>
                            ))}
                            <span className="bg-badge token">{a.primitive}</span>
                            {a.version && <span className="bg-badge poc">{a.version}</span>}
                          </div>
                          {a.findings_summary && (
                            <div className="audit-findings-bar">
                              {a.findings_summary.critical > 0 && <span className="audit-fb-dot critical" title={`${a.findings_summary.critical} critical`}>{a.findings_summary.critical}</span>}
                              {a.findings_summary.high > 0 && <span className="audit-fb-dot high" title={`${a.findings_summary.high} high`}>{a.findings_summary.high}</span>}
                              {a.findings_summary.medium > 0 && <span className="audit-fb-dot medium" title={`${a.findings_summary.medium} medium`}>{a.findings_summary.medium}</span>}
                              {a.findings_summary.low > 0 && <span className="audit-fb-dot low" title={`${a.findings_summary.low} low`}>{a.findings_summary.low}</span>}
                              {a.findings_summary.informational > 0 && <span className="audit-fb-dot info" title={`${a.findings_summary.informational} informational`}>{a.findings_summary.informational}</span>}
                            </div>
                          )}
                        </div>
                        <div className="audit-tc-footer">
                          <span className="bg-card-stat">PDF Report</span>
                          <span className="bg-card-arrow">Download ↗</span>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })
      ) : (
        /* Flat grid mode */
        <div className="bg-grid">
          {filtered.map(a => (
            <a
              key={a.id}
              href={a.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card ob-link-reset"
            >
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
              <p className="bg-card-desc">{a.title}</p>
              <div className="bg-card-badges">
                {a.chains.map(c => (
                  <span key={c} className="bg-badge chain">{c}</span>
                ))}
                <span className="bg-badge token">{a.primitive}</span>
                <span className={`bg-badge ${a.category === 'DeFi' ? 'chain' : 'token'}`}>{a.category}</span>
                {a.version && <span className="bg-badge poc">{a.version}</span>}
              </div>
              {a.findings_summary && (
                <div className="audit-findings-bar">
                  {a.findings_summary.critical > 0 && <span className="audit-fb-dot critical">{a.findings_summary.critical}</span>}
                  {a.findings_summary.high > 0 && <span className="audit-fb-dot high">{a.findings_summary.high}</span>}
                  {a.findings_summary.medium > 0 && <span className="audit-fb-dot medium">{a.findings_summary.medium}</span>}
                  {a.findings_summary.low > 0 && <span className="audit-fb-dot low">{a.findings_summary.low}</span>}
                  {a.findings_summary.informational > 0 && <span className="audit-fb-dot info">{a.findings_summary.informational}</span>}
                </div>
              )}
              <div className="bg-card-footer">
                <span className="bg-card-stat">PDF Report</span>
                <span className="bg-card-arrow">Download ↗</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
