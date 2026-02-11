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
  // Rich fields from protocol JSON
  description?: string;
  kycRequired?: boolean;
  pocRequired?: boolean;
  triaged?: boolean;
  payoutToken?: string;
  severityMax?: number;  // critical max
  severityHigh?: number; // high max
  scopeCount?: number;   // number of in-scope items
  contractCount?: number;
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
}
