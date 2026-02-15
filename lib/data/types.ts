export interface Stat {
  label: string;
  value: string;
}

export interface Bounty {
  id: string;
  name: string;
  category: string[] | string;
  reward?: string;
  chains: string[];
  icon?: string;
  logo_url?: string | null;
  tags?: string[];
  liveSince?: string;
  language?: string;
  type?: string;
  maxReward?: string;
  maxRewardNum?: number;
  description?: string;
  kycRequired?: boolean;
  pocRequired?: boolean;
  triaged?: boolean;
  payoutToken?: string;
  severityMax?: number;
  severityHigh?: number;
  scopeCount?: number;
  contractCount?: number;
  // Enrichment — hunter toolkit
  website_url?: string | null;
  twitter?: string | null;
  discord?: string | null;
  telegram?: string | null;
  github_url?: string | null;
  docs_url?: string | null;
  security_email?: string | null;
  contact_email?: string | null;
  bounty_policy_url?: string | null;
  auditors?: string[] | null;
  audit_report_urls?: string[] | null;
  whitepaper_url?: string | null;
  coingecko_id?: string | null;
  market_cap_rank?: number | null;
}

export interface Finding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  timeAgo: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  initials: string;
  earned: string;
}

export interface PlatformFeature {
  icon: string;
  name: string;
  description: string;
  slug: string;
  comingSoon?: boolean;
  tier?: 'core' | 'support' | 'coming';
  longDescription: string;
  highlights: string[];
}
