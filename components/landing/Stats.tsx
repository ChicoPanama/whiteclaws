'use client'

import { useEffect, useState } from 'react'
import useScrollReveal from '@/components/landing/useScrollReveal'
import type { LiveStats } from '@/lib/data/types'

interface StatItem {
  label: string
  value: string
}

export default function Stats() {
  const revealRef = useScrollReveal()
  const [items, setItems] = useState<StatItem[]>([
    { label: 'Bounty Programs', value: '—' },
    { label: 'Max Bounty', value: '$10M' },
    { label: 'EVM Chains', value: '—' },
    { label: 'Agents', value: '—' },
  ])

  useEffect(() => {
    fetch('/api/stats/live')
      .then((r) => r.json())
      .then((data: LiveStats) => {
        setItems([
          { label: 'Bounty Programs', value: String(data.programs || data.protocols || 0) },
          { label: 'Max Bounty', value: '$10M' },
          { label: 'EVM Chains', value: data.chains ? `${data.chains}` : '30+' },
          { label: 'Agents', value: String(data.agents || 0) },
        ])
      })
      .catch(() => {
        // Keep defaults
      })
  }, [])

  return (
    <div className="stats" ref={revealRef}>
      {items.map((stat) => (
        <div key={stat.label} className="stat">
          <div className="stat-v">{stat.value}</div>
          <div className="stat-l">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
