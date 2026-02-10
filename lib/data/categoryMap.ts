const CATEGORY_MAP: Record<string, string> = {
  'DeFi': 'DeFi',
  'DeFi Lending': 'DeFi',
  'DeFi Stablecoin': 'DeFi',
  'DeFi Staking': 'DeFi',
  'DeFi Trading': 'DeFi',
  'DeFi Yield': 'DeFi',
  'DEX': 'DeFi',
  'Layer 2': 'L2 / L1',
  'L2 / L1': 'L2 / L1',
  'L2/L1': 'L2 / L1',
  'Bridge': 'Bridge',
  'Infrastructure': 'Infrastructure',
  'Staking Infrastructure': 'Infrastructure',
  'Naming': 'Infrastructure',
  'Security Platform': 'Infrastructure',
  'Gaming/NFT': 'Infrastructure',
  'Privacy': 'Infrastructure',
  'RWA Tokenization': 'DeFi',
}

export function normalizeCategory(raw: string): string {
  return CATEGORY_MAP[raw] ?? raw
}

const CHAIN_MAP: Record<string, string> = {
  ethereum: 'ETH',
  base: 'Base',
  arbitrum: 'ARB',
  optimism: 'OP',
  polygon: 'MATIC',
  bsc: 'BSC',
  hedera: 'HBAR',
  stacks: 'STX',
  cosmos: 'ATOM',
  near: 'NEAR',
  zano: 'ZANO',
  solana: 'SOL',
}

export function normalizeChain(raw: string): string {
  return CHAIN_MAP[raw.toLowerCase()] ?? raw.toUpperCase()
}
