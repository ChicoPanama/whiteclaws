import { Stat, Finding, LeaderboardEntry, PlatformFeature } from './types';

// Stats data
export const stats: Stat[] = [
  { label: 'Protected TVL', value: '$42M+' },
  { label: 'Vulns Found', value: '847' },
  { label: 'Researchers', value: '12K+' },
  { label: 'Protocols', value: '456' },
];

// Findings data (converted from recentFindings)
export const findings: Finding[] = [
  {
    id: '1',
    severity: 'critical',
    description: 'Reentrancy in reward distributor',
    timeAgo: '2h ago',
  },
  {
    id: '2',
    severity: 'high',
    description: 'Integer overflow in staking checkpoint',
    timeAgo: '6h ago',
  },
  {
    id: '3',
    severity: 'medium',
    description: 'Unchecked return value on external call',
    timeAgo: '1d ago',
  },
  {
    id: '4',
    severity: 'medium',
    description: 'Flash loan oracle manipulation vector',
    timeAgo: '2d ago',
  },
  {
    id: '5',
    severity: 'low',
    description: 'Gas optimization in batch transfer',
    timeAgo: '3d ago',
  },
];

// Platform features data (converted from existing platformFeatures)
export const platformFeatures: PlatformFeature[] = [
  {
    icon: '🎯',
    name: 'Bug Bounty Programs',
    description: 'Launch managed bounty programs. 12,000+ researchers. Escrowed payments. Full lifecycle triage and verification.',
  },
  {
    icon: '🤖',
    name: 'AI Audit Agent',
    description: 'Autonomous agents that scan your codebase continuously. Slither + Mythril + AI reasoning. Runs 24/7 via Clawd.',
  },
  {
    icon: '📡',
    name: 'Onchain Monitoring',
    description: 'Real-time transaction surveillance with anomaly detection across all EVM chains. Alerts before funds drain.',
  },
  {
    icon: '🏆',
    name: 'Audit Competitions',
    description: 'Time-boxed competitive audits. Multiple researchers review code simultaneously. Faster coverage, diverse perspectives.',
  },
  {
    icon: '🛡️',
    name: 'Safe Harbor',
    description: 'Legal framework for whitehats to rescue funds during active exploits. Redirect recovered assets to protocol vaults.',
  },
  {
    icon: '🔒',
    name: 'Vaults & Escrow',
    description: 'Onchain escrow for bounty payments. Transparent, trustless, immediate payouts upon verified findings.',
  },
  {
    icon: '📋',
    name: 'Managed Triage',
    description: 'Expert in-house triage team. 27,000+ reports reviewed. Only validated findings reach your team.',
  },
  {
    icon: '🔍',
    name: 'PR Reviews',
    description: 'Automated security review on every pull request. Catch vulnerabilities before they ship to production.',
  },
];

// Leaderboard data (converted from existing leaderboard)
export const leaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'pwned_admin',
    initials: 'PA',
    earned: '$2,847,000',
  },
  {
    rank: 2,
    name: '0xshadow',
    initials: '0S',
    earned: '$1,923,500',
  },
  {
    rank: 3,
    name: 'reentrancy_queen',
    initials: 'RQ',
    earned: '$1,456,200',
  },
  {
    rank: 4,
    name: 'defi_doctor',
    initials: 'DD',
    earned: '$987,300',
  },
  {
    rank: 5,
    name: 'flash_loan_fury',
    initials: 'FL',
    earned: '$845,000',
  },
  {
    rank: 6,
    name: 'bytecode_bandit',
    initials: 'BB',
    earned: '$723,800',
  },
  {
    rank: 7,
    name: 'slither_sensei',
    initials: 'SS',
    earned: '$612,400',
  },
  {
    rank: 8,
    name: 'mythril_monk',
    initials: 'MM',
    earned: '$498,000',
  },
  {
    rank: 9,
    name: 'oracle_oracle',
    initials: 'OO',
    earned: '$389,200',
  },
  {
    rank: 10,
    name: 'gas_goblin',
    initials: 'GG',
    earned: '$312,500',
  },
];

// Marquee chains data (extracted from various sources)
export const marqueeChains: string[] = [
  'ETH',
  'Base',
  'ARB',
  'OP',
  'BNB',
  'POLYGON',
  'AVAX',
  'FANTOM',
  'CELO',
  'MOONBEAM',
  'OPTIMISM',
  'ARBITRUM',
  'POLYGON-ZKEVM',
  'LINEA',
  'ZKSYNC',
  'SCROLL',
  'MANTLE',
  'BLAST',
  'MODE',
  'ZORA',
];

// Scanner messages data (created based on context)
export const scannerMessages: string[] = [
  'Scanning contracts for vulnerabilities...',
  'Analyzing bytecode patterns...',
  'Checking for reentrancy risks...',
  'Detecting integer overflow issues...',
  'Verifying access controls...',
  'Auditing external calls...',
  'Inspecting state changes...',
  'Validating input sanitization...',
  'Cross-referencing with known exploits...',
  'Generating security report...',
];