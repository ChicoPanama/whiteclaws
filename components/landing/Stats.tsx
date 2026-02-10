'use client'

import useScrollReveal from '@/components/landing/useScrollReveal'
import { stats } from '@/lib/data/constants'

export default function Stats() {
  const revealRef = useScrollReveal()

  return (
    <div className="stats">
      {stats.map((stat) => (
        <div key={stat.label} className="stat" ref={revealRef}>
          <div className="stat-v">{stat.value}</div>
          <div className="stat-l">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
