export interface ChainInfo {
  id: number
  name: string
  symbol: string
}

export interface AccessStatus {
  address: string
  hasAccess: boolean
  isValidated: boolean
  expiry: string | null
}

export interface AccessMintResponse {
  ok: boolean
  txHash?: string
  message?: string
  error?: string
}

export interface AgentWallet {
  address: string
}
