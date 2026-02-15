'use client'

type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'

interface SeverityBadgeProps {
  level: SeverityLevel
  showDot?: boolean
  className?: string
}

const severityConfig: Record<SeverityLevel, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#FF4444' },
  high: { label: 'High', color: '#FF8C42' },
  medium: { label: 'Medium', color: '#FFD166' },
  low: { label: 'Low', color: '#60A5FA' },
  info: { label: 'Info', color: '#707070' },
}

export default function SeverityBadge({
  level,
  showDot = true,
  className = '',
}: SeverityBadgeProps) {
  const config = severityConfig[level]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${className}`}
      style={{
        background: `${config.color}15`,
        border: `1px solid ${config.color}40`,
        color: config.color,
        boxShadow: `0 0 10px ${config.color}15`,
      }}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: config.color,
            boxShadow: `0 0 6px ${config.color}`,
          }}
        />
      )}
      {config.label}
    </span>
  )
}
