'use client'

import { useState } from 'react'
import type { Hero } from '@/lib/types/heroes'

interface HeroAvatarProps {
  hero: Hero
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showRank?: boolean
}

const SIZE_MAP = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
}

export default function HeroAvatar({ hero, size = 'md', showRank = false }: HeroAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const px = SIZE_MAP[size]
  const { avatar_seed, has_custom_pfp, pfp_url, rank } = hero

  const showImage = has_custom_pfp && !imgError

  return (
    <div className={`ha ha-${size}`} style={{ width: px, height: px }}>
      {showImage ? (
        <img
          src={pfp_url}
          alt={hero.handle}
          className="ha-img"
          width={px}
          height={px}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div
          className="ha-gen"
          style={{
            background: `linear-gradient(135deg, ${avatar_seed.bg} 0%, ${avatar_seed.accent}33 100%)`,
            borderColor: avatar_seed.accent + '44',
          }}
        >
          <span
            className="ha-init"
            style={{ color: avatar_seed.accent }}
          >
            {avatar_seed.initials}
          </span>
        </div>
      )}
      {showRank && rank && rank <= 3 && (
        <div className={`ha-badge ha-badge-${rank}`}>
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
        </div>
      )}
    </div>
  )
}
