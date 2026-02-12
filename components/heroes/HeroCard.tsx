'use client'

import type { Hero } from '@/lib/types/heroes'
import HeroAvatar from './HeroAvatar'

interface HeroCardProps {
  hero: Hero
  isCurrentUser?: boolean
  featured?: boolean
}

export default function HeroCard({ hero, isCurrentUser = false, featured = false }: HeroCardProps) {
  const { handle, bugs_found, earned_display, links, primary_link, rank, member_since, imu_pledged } = hero

  return (
    <a
      href={primary_link}
      target="_blank"
      rel="noopener noreferrer"
      className={`hc ${featured ? 'hc-feat' : ''} ${isCurrentUser ? 'hc-king' : ''}`}
    >
      {/* Rank badge */}
      {rank && (
        <span className={`hc-rank ${rank <= 3 ? `hc-rank-${rank}` : ''}`}>
          #{String(rank).padStart(2, '0')}
        </span>
      )}

      {/* Avatar */}
      <div className="hc-av">
        <HeroAvatar hero={hero} size={featured ? 'xl' : 'lg'} showRank={featured} />
      </div>

      {/* Name + king emoji */}
      <div className="hc-name">
        <span className="hc-handle">
          {isCurrentUser && <span className="hc-crown">👑</span>}
          {handle}
        </span>
        {links.x_handle && (
          <span className="hc-x">@{links.x_handle}</span>
        )}
      </div>

      {/* Stats row */}
      <div className="hc-stats">
        <div className="hc-stat">
          <span className="hc-stat-val">{earned_display}</span>
          <span className="hc-stat-lbl">Earned</span>
        </div>
        <div className="hc-stat-divider" />
        <div className="hc-stat">
          <span className="hc-stat-val">{bugs_found ?? 0}</span>
          <span className="hc-stat-lbl">Bugs</span>
        </div>
        {featured && imu_pledged && imu_pledged > 0 && (
          <>
            <div className="hc-stat-divider" />
            <div className="hc-stat">
              <span className="hc-stat-val">{(imu_pledged / 1000).toFixed(0)}K</span>
              <span className="hc-stat-lbl">IMU Pledged</span>
            </div>
          </>
        )}
      </div>

      {/* Social icons */}
      <div className="hc-links">
        {links.x_url && (
          <span className="hc-social" title={`@${links.x_handle}`}>𝕏</span>
        )}
        {links.github_url && (
          <span className="hc-social" title="GitHub">⌂</span>
        )}
        {member_since && featured && (
          <span className="hc-since">Since {member_since}</span>
        )}
      </div>

      {/* King glow overlay for logged-in heroes */}
      {isCurrentUser && <div className="hc-king-glow" />}
    </a>
  )
}
