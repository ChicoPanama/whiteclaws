'use client'

import { useState, useEffect } from 'react'
import { stats } from '@/lib/data/constants'

export default function Stats() {
  const [animatedValues, setAnimatedValues] = useState(stats.map(() => '0'))

  useEffect(() => {
    const timers = stats.map((stat, index) => {
      const targetValue = stat.value.replace(/[^0-9]/g, '')
      const duration = 2000
      const steps = 60
      const increment = parseInt(targetValue) / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= parseInt(targetValue)) {
          current = parseInt(targetValue)
          clearInterval(timer)
        }

        setAnimatedValues((prev) => {
          const newValues = [...prev]
          newValues[index] = stat.value.includes('$')
            ? `$${Math.floor(current).toLocaleString()}+`
            : `${Math.floor(current).toLocaleString()}+`
          return newValues
        })
      }, duration / steps)

      return timer
    })

    return () => timers.forEach(timer => clearInterval(timer))
  }, [])

  return (
    <div className="stats">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="text-center animate-slideUp"
          style={{ animationDelay: `${index * 0.2}s` }}
        >
          <div className="text-4xl font-bold text-green font-mono mb-2">
            {animatedValues[index]}
          </div>
          <div className="text-sm text-dim font-medium uppercase tracking-wider">
            {stat.label}
          </div>
          <div className="mt-4 h-px bg-border w-16 mx-auto" />
          <div className="mt-4 text-xs text-muted">
            {index === 0 && 'Across all protected protocols'}
            {index === 1 && 'Critical vulnerabilities identified'}
            {index === 2 && 'Active security researchers'}
            {index === 3 && 'Live bug bounty programs'}
          </div>
        </div>
      ))}
    </div>
  )
}