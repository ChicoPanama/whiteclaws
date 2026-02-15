'use client'

import { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  subtext?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  variant?: 'default' | 'accent' | 'warning' | 'danger'
  className?: string
}

export default function StatCard({
  icon,
  label,
  value,
  subtext,
  trend,
  trendValue,
  variant = 'default',
  className = '',
}: StatCardProps) {
  const variantStyles = {
    default: {
      bg: 'bg-[var(--surface)]',
      border: 'border-[var(--border)]',
      iconBg: 'bg-[var(--surface-2)]',
    },
    accent: {
      bg: 'bg-[rgba(137,224,109,0.05)]',
      border: 'border-[rgba(137,224,109,0.2)]',
      iconBg: 'bg-[rgba(137,224,109,0.1)]',
    },
    warning: {
      bg: 'bg-[rgba(255,209,102,0.05)]',
      border: 'border-[rgba(255,209,102,0.2)]',
      iconBg: 'bg-[rgba(255,209,102,0.1)]',
    },
    danger: {
      bg: 'bg-[rgba(255,68,68,0.05)]',
      border: 'border-[rgba(255,68,68,0.2)]',
      iconBg: 'bg-[rgba(255,68,68,0.1)]',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div
      className={`rounded-xl p-6 transition-all duration-300 hover:-translate-y-0.5 ${styles.bg} border ${styles.border} ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[var(--muted)] font-medium">{label}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${styles.iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="font-mono text-3xl font-bold text-white mb-2">
        {value}
      </div>

      {(subtext || trend) && (
        <div className="flex items-center gap-2 text-sm">
          {trend && (
            <span
              className={`font-medium ${
                trend === 'up'
                  ? 'text-[var(--green)]'
                  : trend === 'down'
                  ? 'text-[var(--red)]'
                  : 'text-[var(--muted)]'
              }`}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </span>
          )}
          {subtext && <span className="text-[var(--muted)]">{subtext}</span>}
        </div>
      )}
    </div>
  )
}
