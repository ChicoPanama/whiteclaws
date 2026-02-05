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
}

export const bountyPrograms: BountyProgram[] = [
  {
    id: 'uniswap-v4',
    name: 'Uniswap V4',
    icon: 'U',
    category: 'DeFi',
    tags: ['AMM', 'Smart Contract'],
    chains: ['ETH', 'ARB'],
    language: 'Solidity',
    maxReward: '$3,000,000',
    maxRewardNum: 3000000,
    liveSince: 'Jan 2025',
    type: 'Smart Contract',
  },
  {
    id: 'wormhole',
    name: 'Wormhole',
    icon: 'W',
    category: 'Bridge',
    tags: ['Cross-chain', 'Protocol'],
    chains: ['Multi'],
    language: 'Rust',
    maxReward: '$2,500,000',
    maxRewardNum: 2500000,
    liveSince: 'Mar 2024',
    type: 'Protocol',
  },
  {
    id: 'optimism',
    name: 'Optimism',
    icon: 'O',
    category: 'L2 / L1',
    tags: ['Rollup', 'Blockchain/DLT'],
    chains: ['OP'],
    language: 'Go',
    maxReward: '$2,000,000',
    maxRewardNum: 2000000,
    liveSince: 'Feb 2024',
    type: 'Blockchain/DLT',
  },
  {
    id: 'chainlink-ccip',
    name: 'Chainlink CCIP',
    icon: 'C',
    category: 'Infrastructure',
    tags: ['Oracle', 'Protocol'],
    chains: ['Multi'],
    language: 'Solidity',
    maxReward: '$1,500,000',
    maxRewardNum: 1500000,
    liveSince: 'Jun 2024',
    type: 'Protocol',
  },
  {
    id: 'makerdao',
    name: 'MakerDAO',
    icon: 'M',
    category: 'DeFi',
    tags: ['Lending', 'Smart Contract'],
    chains: ['ETH'],
    language: 'Solidity',
    maxReward: '$1,000,000',
    maxRewardNum: 1000000,
    liveSince: 'Nov 2023',
    type: 'Smart Contract',
  },
  {
    id: 'polygon-zkevm',
    name: 'Polygon zkEVM',
    icon: 'P',
    category: 'L2 / L1',
    tags: ['ZK Rollup', 'Blockchain/DLT'],
    chains: ['Polygon'],
    language: 'Rust',
    maxReward: '$1,000,000',
    maxRewardNum: 1000000,
    liveSince: 'May 2024',
    type: 'Blockchain/DLT',
  },
  {
    id: 'lido',
    name: 'Lido',
    icon: 'L',
    category: 'DeFi',
    tags: ['Staking', 'Smart Contract'],
    chains: ['ETH'],
    language: 'Solidity',
    maxReward: '$750,000',
    maxRewardNum: 750000,
    liveSince: 'Aug 2024',
    type: 'Smart Contract',
  },
  {
    id: 'morpho',
    name: 'Morpho',
    icon: 'Mo',
    category: 'DeFi',
    tags: ['Lending', 'Smart Contract'],
    chains: ['ETH', 'Base'],
    language: 'Solidity',
    maxReward: '$500,000',
    maxRewardNum: 500000,
    liveSince: 'Jul 2024',
    type: 'Smart Contract',
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    icon: 'A',
    category: 'L2 / L1',
    tags: ['Blockchain/DLT'],
    chains: ['AVAX'],
    language: 'Go',
    maxReward: '$500,000',
    maxRewardNum: 500000,
    liveSince: 'Apr 2024',
    type: 'Blockchain/DLT',
  },
]

export const leaderboard = [
  { rank: 1, name: 'pwned_admin', earned: '$2,847,000', findings: 47, critical: 12 },
  { rank: 2, name: '0xshadow', earned: '$1,923,500', findings: 38, critical: 9 },
  { rank: 3, name: 'reentrancy_queen', earned: '$1,456,200', findings: 31, critical: 7 },
  { rank: 4, name: 'defi_doctor', earned: '$987,300', findings: 28, critical: 5 },
  { rank: 5, name: 'flash_loan_fury', earned: '$845,000', findings: 22, critical: 4 },
  { rank: 6, name: 'bytecode_bandit', earned: '$723,800', findings: 19, critical: 3 },
  { rank: 7, name: 'slither_sensei', earned: '$612,400', findings: 17, critical: 3 },
  { rank: 8, name: 'mythril_monk', earned: '$498,000', findings: 15, critical: 2 },
  { rank: 9, name: 'oracle_oracle', earned: '$389,200', findings: 13, critical: 2 },
  { rank: 10, name: 'gas_goblin', earned: '$312,500', findings: 11, critical: 1 },
]

export const platformFeatures = [
  { icon: '🎯', name: 'Bug Bounty Programs', desc: 'Launch managed bounty programs. 12,000+ researchers. Escrowed payments. Full lifecycle triage and verification.', tag: 'Core' },
  { icon: '🤖', name: 'AI Audit Agent', desc: 'Autonomous agents that scan your codebase continuously. Slither + Mythril + AI reasoning. Runs 24/7 via Clawd.', tag: 'Agent' },
  { icon: '📡', name: 'Onchain Monitoring', desc: 'Real-time transaction surveillance with anomaly detection across all EVM chains. Alerts before funds drain.', tag: 'Defense' },
  { icon: '🏆', name: 'Audit Competitions', desc: 'Time-boxed competitive audits. Multiple researchers review code simultaneously. Faster coverage, diverse perspectives.', tag: 'Core' },
  { icon: '🛡️', name: 'Safe Harbor', desc: 'Legal framework for whitehats to rescue funds during active exploits. Redirect recovered assets to protocol vaults.', tag: 'Legal' },
  { icon: '🔒', name: 'Vaults & Escrow', desc: 'Onchain escrow for bounty payments. Transparent, trustless, immediate payouts upon verified findings.', tag: 'Infra' },
  { icon: '📋', name: 'Managed Triage', desc: 'Expert in-house triage team. 27,000+ reports reviewed. Only validated findings reach your team.', tag: 'Service' },
  { icon: '🔍', name: 'PR Reviews', desc: 'Automated security review on every pull request. Catch vulnerabilities before they ship to production.', tag: 'CI/CD' },
]

export const categories = [
  { name: 'Smart Contract', count: 94 },
  { name: 'Blockchain / DLT', count: 28 },
  { name: 'Websites & Apps', count: 18 },
  { name: 'Protocol Logic', count: 12 },
  { name: 'Infrastructure', count: 4 },
]

export const recentFindings = [
  { severity: 'critical', text: 'Reentrancy in reward distributor', time: '2h ago' },
  { severity: 'high', text: 'Integer overflow in staking checkpoint', time: '6h ago' },
  { severity: 'medium', text: 'Unchecked return value on external call', time: '1d ago' },
  { severity: 'medium', text: 'Flash loan oracle manipulation vector', time: '2d ago' },
  { severity: 'low', text: 'Gas optimization in batch transfer', time: '3d ago' },
]
