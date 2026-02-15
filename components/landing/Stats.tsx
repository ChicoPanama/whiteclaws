'use client'

import { useEffect, useState } from 'react'
import useScrollReveal from '@/components/landing/useScrollReveal'
import AnimatedCounter from '@/components/AnimatedCounter'
import type { LiveStats } from '@/lib/data/types'

interface StatItem {
  label: string
  value: number
  prefix?: string
  suffix?: string
  fallback: string
}

export default function Stats() {
  const revealRef = useScrollReveal()
  const [items, setItems] = useState<StatItem[]>([
    { label: 'Bounty Programs', value: 0, fallback: '—' },
    { label: 'Max Bounty', value: 10, prefix: '$', suffix: 'M', fallback: '$10M' },
    { label: 'EVM Chains', value: 0, fallback: '—' },
    { label: 'Agents', value: 0, fallback: '—' },
  ])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/stats/live')
      .then((r) => r.json())
      .then((data: LiveStats) => {
        setItems([
          { label: 'Bounty Programs', value: data.programs || data.protocols || 459, fallback: '—' },
          { label: 'Max Bounty', value: 10, prefix: '$', suffix: 'M', fallback: '$10M' },
          { label: 'EVM Chains', value: data.chains || 30, fallback: '30+' },
          { label: 'Agents', value: data.agents || 0, fallback: '—' },
        ])
        setLoaded(true)
      })
      .catch(() => {
        // Keep defaults but show fallback values
        setLoaded(true)
      })
  }, [])

  return (
    <div className="stats" ref={revealRef}>
      {items.map((stat) => (
        <div key={stat.label} className="stat">
          <div className="stat-v">
            {loaded ? (
              <AnimatedCounter 
                value={stat.value} 
                prefix={stat.prefix} 
                suffix={stat.suffix}
                duration={1500}
              />
            ) : (
              stat.fallback
            )}
          </div>
          <div className="stat-l">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
