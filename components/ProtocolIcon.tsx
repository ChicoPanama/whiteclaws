'use client'

import { useState } from 'react'

interface ProtocolIconProps {
  name: string
  logo_url?: string | null
  size?: number
  className?: string
}

export default function ProtocolIcon({ name, logo_url, size = 36, className = '' }: ProtocolIconProps) {
  const [imgError, setImgError] = useState(false)
  const initial = name.charAt(0).toUpperCase()

  if (logo_url && !imgError) {
    return (
      <img
        src={logo_url}
        alt={`${name} logo`}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
        className={className}
        style={{ borderRadius: 8, objectFit: 'contain' }}
      />
    )
  }

  return (
    <span className={className} style={{
      width: size,
      height: size,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: size * 0.39,
      flexShrink: 0,
    }}>
      {initial}
    </span>
  )
}
