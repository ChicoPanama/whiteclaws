import { Bounty, LeaderboardEntry, PlatformFeature } from './data/types';
import { 
  bounties as bountyConstants,
  leaderboard as leaderboardConstants,
  platformFeatures as platformFeatureConstants,
  findings as findingConstants
} from './data/constants';

// Keep existing interfaces for backward compatibility
export interface BountyProgram {
  id: string
  name: string
  icon: string
  category: string
  tags: string[]
  chains: string[]
  language: string
  maxReward: string
  maxRewardNum: number
  liveSince: string
  type: string
  vaultAddress?: string
  vaultTvl?: string
  totalPaid?: string
  resolutionTime?: string
  platform?: string
  triaged?: boolean
}

// Map new Bounty type to existing BountyProgram interface
export const bountyPrograms: BountyProgram[] = bountyConstants.map(bounty => ({
  id: bounty.id,
  name: bounty.name,
  icon: bounty.icon || '',
  category: Array.isArray(bounty.category) ? bounty.category[0] : bounty.category,
  tags: [],
  chains: bounty.chains,
  language: 'Solidity',
  maxReward: bounty.reward || '$0',
  maxRewardNum: parseInt((bounty.reward || '$0').replace(/[^0-9]/g, '')) || 0,
  liveSince: 'Live',
  type: 'Smart Contract',
}));

export interface LeaderboardEntryOld {
  rank: number;
  name: string;
  earned: string;
  findings: number;
  critical: number;
}

// Map new LeaderboardEntry type to existing format
export const leaderboard: LeaderboardEntryOld[] = leaderboardConstants.map(entry => ({
  rank: entry.rank,
  name: entry.name,
  earned: entry.earned,
  findings: 0,
  critical: 0
}));

export interface PlatformFeatureOld {
  icon: string;
  name: string;
  desc: string;
  tag: string;
}

// Map new PlatformFeature type to existing format
export const platformFeatures: PlatformFeatureOld[] = platformFeatureConstants.map(feature => ({
  icon: feature.icon,
  name: feature.name,
  desc: feature.description,
  tag: 'Core'
}));

export const categories = [
  { name: 'Smart Contract', count: 94 },
  { name: 'Blockchain / DLT', count: 28 },
  { name: 'Websites & Apps', count: 18 },
  { name: 'Protocol Logic', count: 12 },
  { name: 'Infrastructure', count: 4 },
]

export interface RecentFinding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  text: string;
  time: string;
}

// Map new Finding type to existing format
export const recentFindings: RecentFinding[] = findingConstants.map(finding => ({
  severity: finding.severity,
  text: finding.description,
  time: finding.timeAgo
}));
