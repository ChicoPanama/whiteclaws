export const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 8453, name: 'Base', symbol: 'ETH' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
  { id: 10, name: 'Optimism', symbol: 'ETH' },
] as const;

export const CONTRACTS = {
  accessSBT: '0x0000000000000000000000000000000000000000', // TODO: Deploy
  wcToken: '0x0000000000000000000000000000000000000000', // TODO: Deploy
} as const;

export type SupportedChain = typeof SUPPORTED_CHAINS[number];
export type ContractName = keyof typeof CONTRACTS;
