// Core types for WhiteClaws bounty agent platform

export interface Protocol {
  id: string;
  name: string;
  slug: string;
  immunefiUrl: string;
  chains: string[];
  maxBounty: number; // USD
  tvl: number; // USD
  logoUrl: string;
  description: string;
  contracts: ContractInfo[];
  isActive: boolean;
}

export interface ContractInfo {
  address: string;
  chain: string;
  name: string;
  verified: boolean;
}

export interface User {
  id: string;
  twitterId: string;
  handle: string;
  displayName: string;
  avatarUrl: string;
  isAgent: boolean;
  reputationScore: number;
  specialties: string[];
  walletAddress?: string;
  createdAt: Date;
}

export interface Finding {
  id: string;
  protocolId: string;
  researcherId: string;
  title: string;
  severity: Severity;
  encryptedReportUrl: string; // S3/Supabase storage URL
  encryptedPocUrl?: string;
  status: FindingStatus;
  bountyAmount: number;
  claimedAt?: Date;
  acceptedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type FindingStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'paid';

export interface Message {
  id: string;
  protocolId: string;
  authorId: string;
  parentId?: string;
  content: string;
  isPinned: boolean;
  createdAt: Date;
}

export interface ProtocolAccess {
  protocolId: string;
  userId: string;
  accessLevel: 'admin' | 'researcher' | 'viewer';
  grantedAt: Date;
}

// Encryption types for client-side encryption
export interface EncryptedPayload {
  version: number;
  protocolPublicKey: string;
  encryptedData: string; // base64
  nonce: string; // base64
  createdAt: Date;
}

// Ranking system types
export interface AgentRanking {
  agentId: string;
  points: number;
  rank: number;
  streakDays: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  totalBountyAmount: number;
  specialties: string[];
  lastActivityAt: Date;
}

export interface SeverityPoints {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export const SEVERITY_POINTS: SeverityPoints = {
  critical:101,
  high: 501,
  medium: 201,
  low: 51,
};

// Authentication types
export type AuthProvider = 'twitter' | 'privy' | 'wallet';

export interface AuthSession {
  userId: string;
  provider: AuthProvider;
  createdAt: Date;
  expiresAt: Date;
}

// Platform configuration
export interface PlatformConfig {
  minBountyThreshold: number; // $1,000
  maxBountyMultiplier: number; // For ranking: max_bounty / $1,000,000
  activityBonusDaily: number; // +10 points per day streak
  activityBonusWeekly: number; // +50 points per week streak
  inactivityDecayRate: number; // -5% after 30 days inactive
  alertThresholds: {
    immediate: number; // $100K
    activeHours: number; // $25K
    logOnly: number; // $1K
  };
}

export const DEFAULT_CONFIG: PlatformConfig = {
  minBountyThreshold: 1000,
  maxBountyMultiplier: 1, // Will be adjusted per protocol
  activityBonusDaily: 10,
  activityBonusWeekly: 50,
  inactivityDecayRate: 0.05, // 5%
  alertThresholds: {
    immediate: 100000,
    activeHours: 25000,
    logOnly: 1000,
  },
};