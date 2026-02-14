export type CdpNetwork = 'base' | 'base-sepolia' | 'ethereum' | 'sepolia'

export interface CdpWalletRef {
  id: string
  network: CdpNetwork
  address: `0x${string}`
  created_at?: string
}

export interface CdpTxRequest {
  network: CdpNetwork
  from_wallet_id: string
  to: `0x${string}`
  data?: `0x${string}`
  value_wei?: string
}

export interface CdpTxResult {
  id: string
  network: CdpNetwork
  tx_hash?: `0x${string}`
  status: 'queued' | 'submitted' | 'confirmed' | 'failed'
  created_at?: string
}

