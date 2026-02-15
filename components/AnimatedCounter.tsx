'use client'

import { useEffect, useState } from 'react'

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1000,
  className = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const steps = 30
    const increment = value / steps
    const stepDuration = duration / steps
    let step = 0

    const timer = setInterval(() => {
      step++
      const current = Math.min(Math.floor(increment * step), value)
      setDisplayValue(current)

      if (step >= steps) {
        clearInterval(timer)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [value, duration])

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  )
}
