import protocolContracts from '@/data/protocol_contracts.json'

export type ScopeConfig = {
  mode: 'tier1_official'
  tier2_surface_expansion: {
    status: 'coming_soon'
    opt_in_required: true
    premium: true
    features: {
      factory_expansion: true
      proxy_tracking: true
      upgrade_history: true
      deployer_graph: true
      dependency_mapping: true
    }
  }
}

export function getProtocolContracts(slug: string) {
  return (protocolContracts as Record<string, unknown>)[slug] ?? null
}
