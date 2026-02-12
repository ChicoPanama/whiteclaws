export interface HeroAvatarSeed {
  initials: string
  color_idx: number
  bg: string
  accent: string
}

export interface HeroLinks {
  x_handle: string | null
  x_url: string | null
  x_confidence: 'high' | 'medium' | 'low'
  github_url: string | null
  personal_site_url: string | null
}

export interface Hero {
  handle: string
  rank: number | null
  bugs_found: number | null
  total_earned_usd: number | null
  imu_pledged: number | null
  pledgers: number | null
  pledge_url: string
  profile_url: string
  pfp_url: string
  member_since: string | null
  all_time_rank: number | null
  total_earnings_usd_profile: number | null
  bio_text: string | null
  bio_links: string[]
  links: HeroLinks
  total_saved_usd: number | null
  impact_notes: string
  has_custom_pfp: boolean
  avatar_seed: HeroAvatarSeed
  primary_link: string
  earned_display: string
}

export interface HeroesMeta {
  source: string
  source_url: string
  pledged_hackers_count: number
  total_pledged_imu_raw: string | null
  total_pledged_imu: number | null
  active_pledgers: number | null
  extracted_at: string
  enriched_at?: string
  fixes_applied?: string[]
}

export interface HeroesDataset {
  meta: HeroesMeta
  heroes: Hero[]
  warnings: string[]
}
