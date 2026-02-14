#!/usr/bin/env node
/**
 * Phase 2: Deployer-Based Contract Discovery
 *
 * Reads deployer addresses from protocol JSONs (contracts already present),
 * queries Etherscan-family APIs to find ALL contracts deployed by those addresses,
 * and outputs data/deployer_discovered_contracts.json.
 *
 * Requires env vars:
 *   ETHERSCAN_API_KEY       — Ethereum mainnet
 *   ARBISCAN_API_KEY        — Arbitrum
 *   OPTIMISTIC_API_KEY      — Optimism
 *   POLYGONSCAN_API_KEY     — Polygon
 *   BSCSCAN_API_KEY         — BSC
 *   BASESCAN_API_KEY        — Base
 *   SNOWTRACE_API_KEY       — Avalanche
 *   FTMSCAN_API_KEY         — Fantom
 *   BLASTSCAN_API_KEY       — Blast
 *
 * Usage: node scripts/discover-deployer-contracts.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PROTOCOLS_DIR = path.join(ROOT, 'public', 'protocols');
const OUTPUT_PATH = path.join(ROOT, 'data', 'deployer_discovered_contracts.json');

// Chain → API config
const CHAIN_APIS = {
  ethereum: {
    url: 'https://api.etherscan.io/api',
    key: process.env.ETHERSCAN_API_KEY,
  },
  arbitrum: {
    url: 'https://api.arbiscan.io/api',
    key: process.env.ARBISCAN_API_KEY,
  },
  optimism: {
    url: 'https://api-optimistic.etherscan.io/api',
    key: process.env.OPTIMISTIC_API_KEY,
  },
  polygon: {
    url: 'https://api.polygonscan.com/api',
    key: process.env.POLYGONSCAN_API_KEY,
  },
  bsc: {
    url: 'https://api.bscscan.com/api',
    key: process.env.BSCSCAN_API_KEY,
  },
  base: {
    url: 'https://api.basescan.org/api',
    key: process.env.BASESCAN_API_KEY,
  },
  avalanche: {
    url: 'https://api.snowtrace.io/api',
    key: process.env.SNOWTRACE_API_KEY,
  },
  fantom: {
    url: 'https://api.ftmscan.com/api',
    key: process.env.FTMSCAN_API_KEY,
  },
  blast: {
    url: 'https://api.blastscan.io/api',
    key: process.env.BLASTSCAN_API_KEY,
  },
};

// Rate limiter: max N requests per second per chain
const RATE_LIMIT = 5;
const chainLastCalls = {};

async function rateLimit(chain) {
  const now = Date.now();
  if (!chainLastCalls[chain]) chainLastCalls[chain] = [];
  const calls = chainLastCalls[chain];

  // Remove calls older than 1 second
  while (calls.length > 0 && now - calls[0] > 1000) calls.shift();

  if (calls.length >= RATE_LIMIT) {
    const waitMs = 1000 - (now - calls[0]) + 10;
    await new Promise(r => setTimeout(r, waitMs));
  }
  chainLastCalls[chain].push(Date.now());
}

async function getDeployedContracts(deployerAddress, chain) {
  const config = CHAIN_APIS[chain];
  if (!config || !config.key) return [];

  await rateLimit(chain);

  const params = new URLSearchParams({
    module: 'account',
    action: 'txlist',
    address: deployerAddress,
    startblock: '0',
    endblock: '99999999',
    sort: 'asc',
    apikey: config.key,
  });

  try {
    const res = await fetch(`${config.url}?${params}`);
    const data = await res.json();

    if (data.status !== '1' || !Array.isArray(data.result)) return [];

    // Filter for contract creation transactions (to === '' or null)
    return data.result
      .filter(tx => (!tx.to || tx.to === '') && tx.contractAddress)
      .map(tx => ({
        address: tx.contractAddress,
        network: chain,
        name: 'Deployed Contract',
        type: 'Out of Scope',
        deployer: deployerAddress,
      }));
  } catch (err) {
    console.error(`  Error querying ${chain} for ${deployerAddress}: ${err.message}`);
    return [];
  }
}

async function run() {
  // Check which API keys are available
  const availableChains = Object.entries(CHAIN_APIS)
    .filter(([, cfg]) => cfg.key)
    .map(([chain]) => chain);

  if (availableChains.length === 0) {
    console.error('No API keys found. Set at least ETHERSCAN_API_KEY.');
    console.error('Required env vars:', Object.keys(CHAIN_APIS).map(c => CHAIN_APIS[c]).map(() => '').join(''));
    console.error('  ETHERSCAN_API_KEY, ARBISCAN_API_KEY, OPTIMISTIC_API_KEY,');
    console.error('  POLYGONSCAN_API_KEY, BSCSCAN_API_KEY, BASESCAN_API_KEY,');
    console.error('  SNOWTRACE_API_KEY, FTMSCAN_API_KEY, BLASTSCAN_API_KEY');
    process.exit(1);
  }

  console.log(`Available chains: ${availableChains.join(', ')}`);

  const protocolFiles = fs.readdirSync(PROTOCOLS_DIR).filter(f => f.endsWith('.json'));
  const result = {};
  let totalDiscovered = 0;

  for (const file of protocolFiles) {
    const slug = file.replace('.json', '');
    const proto = JSON.parse(fs.readFileSync(path.join(PROTOCOLS_DIR, file), 'utf8'));

    if (!Array.isArray(proto.contracts) || proto.contracts.length === 0) continue;

    // Get unique deployer-like addresses from existing contracts on supported chains
    const contractsByChain = {};
    for (const c of proto.contracts) {
      const chain = (c.network || '').toLowerCase();
      if (!availableChains.includes(chain)) continue;
      if (!c.address || !c.address.startsWith('0x')) continue;
      if (!contractsByChain[chain]) contractsByChain[chain] = new Set();
      contractsByChain[chain].add(c.address.toLowerCase());
    }

    if (Object.keys(contractsByChain).length === 0) continue;

    console.log(`\n[${slug}] Checking deployers on ${Object.keys(contractsByChain).join(', ')}...`);

    const discovered = [];
    const existingAddrs = new Set(
      proto.contracts
        .filter(c => c.address)
        .map(c => `${c.address.toLowerCase()}:${(c.network || '').toLowerCase()}`)
    );

    for (const [chain, addrs] of Object.entries(contractsByChain)) {
      for (const addr of addrs) {
        const deployedContracts = await getDeployedContracts(addr, chain);
        for (const dc of deployedContracts) {
          const key = `${dc.address.toLowerCase()}:${dc.network}`;
          if (!existingAddrs.has(key)) {
            existingAddrs.add(key);
            discovered.push(dc);
          }
        }
      }
    }

    if (discovered.length > 0) {
      result[slug] = discovered;
      totalDiscovered += discovered.length;
      console.log(`  Found ${discovered.length} new contracts`);
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + '\n');
  console.log(`\n=== Deployer Discovery Summary ===`);
  console.log(`Protocols with new contracts: ${Object.keys(result).length}`);
  console.log(`Total contracts discovered:   ${totalDiscovered}`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
