#!/usr/bin/env node
/**
 * Phase 1: Parse Immunefi contract explorer URLs → protocol JSONs
 *
 * Reads data/immunefi_enrichment.json, extracts contract addresses from
 * explorer URLs, and merges them into public/protocols/{slug}.json files.
 *
 * Usage: node scripts/enrich-contracts-from-immunefi.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const ENRICHMENT_PATH = path.join(ROOT, 'data', 'immunefi_enrichment.json');
const PROTOCOLS_DIR = path.join(ROOT, 'public', 'protocols');

// Domain → chain mapping for explorer URLs
const DOMAIN_TO_CHAIN = {
  // Ethereum
  'etherscan.io': 'ethereum',
  'holesky.etherscan.io': 'ethereum-holesky',
  'sepolia.etherscan.io': 'ethereum-sepolia',
  'goerli.etherscan.io': 'ethereum-goerli',

  // L2s
  'arbiscan.io': 'arbitrum',
  'optimistic.etherscan.io': 'optimism',
  'explorer.optimism.io': 'optimism',
  'basescan.org': 'base',
  'scrollscan.com': 'scroll',
  'lineascan.build': 'linea',
  'explorer.zksync.io': 'zksync',
  'zkevm.polygonscan.com': 'polygon-zkevm',
  'explorer.mantle.xyz': 'mantle',
  'mantlescan.info': 'mantle',
  'mantlescan.xyz': 'mantle',
  'explorer.gobob.xyz': 'bob',
  'explorer.inkonchain.com': 'ink',
  'uniscan.xyz': 'unichain',

  // Alt L1s
  'polygonscan.com': 'polygon',
  'bscscan.com': 'bsc',
  'testnet.bscscan.com': 'bsc-testnet',
  'opbnbscan.com': 'opbnb',
  'snowtrace.io': 'avalanche',
  'testnet.snowtrace.io': 'avalanche-testnet',
  'snowscan.xyz': 'avalanche',
  'subnets.avax.network': 'avalanche',
  'ftmscan.com': 'fantom',
  'gnosisscan.io': 'gnosis',
  'celoscan.io': 'celo',
  'moonbeam.moonscan.io': 'moonbeam',
  'moonriver.moonscan.io': 'moonriver',
  'sonicscan.org': 'sonic',
  'berascan.com': 'berachain',
  'flarescan.com': 'flare',
  'aurorascan.dev': 'aurora',
  'cronoscan.com': 'cronos',
  'hecoinfo.com': 'heco',
  'bobascan.com': 'boba',
  'blockexplorer.boba.network': 'boba',
  'explorer.harmony.one': 'harmony',
  'worldscan.org': 'worldchain',
  'hyperevmscan.io': 'hyperliquid',
  'monadscan.com': 'monad',
  'cornscan.io': 'corn',
  'explorer.haven1.org': 'haven1',
  'katanascan.com': 'ronin',
  'explorer.katanarpc.com': 'ronin',
  'botanixscan.io': 'botanix',
  'explorer.hemi.xyz': 'hemi',
  'btrscan.com': 'bitlayer',
  'evm.confluxscan.net': 'conflux',
  'rootstock.blockscout.com': 'rootstock',
  'plasmascan.to': 'plasma',
  'stablescan.xyz': 'stable',

  // Non-EVM
  'solscan.io': 'solana',
  'explorer.solana.com': 'solana',
  'nearblocks.io': 'near',
  'testnet.nearblocks.io': 'near-testnet',
  'explorer.aptoslabs.com': 'aptos',
  'aptoscan.com': 'aptos',
  'finder.terra.money': 'terra',
  'seiscan.io': 'sei',
  'seitrace.com': 'sei',
  'explorer.injective.network': 'injective',
  'suiscan.xyz': 'sui',
  'tronscan.org': 'tron',

  // Multi-chain explorers (blockscout instances)
  'blockscout.com': null, // need subdomain check
  'soneium.blockscout.com': 'soneium',
  'megaeth.blockscout.com': 'megaeth',
  'unichain.blockscout.com': 'unichain',

  // Protocol-specific explorers
  'explorer.lyra.finance': 'lyra',
  'explorer.orderly.network': 'orderly',
  'explorer.immutable.com': 'immutable',
  'phoenix-explorer.plumenetwork.xyz': 'plume',
  'explorer.plume.org': 'plume',
  'maizenet-explorer.usecorn.com': 'corn',
  'eth.xterscan.io': 'ethereum',
  'bnb.xterscan.io': 'bsc',
  'purrsec.com': null, // security platform, not explorer
  'oklink.com': null, // multi-chain, hard to determine
};

// Path patterns that indicate a contract address URL
const ADDRESS_PATTERNS = ['/address/', '/token/', '/account/'];

function parseExplorerUrl(urlStr) {
  let url;
  try {
    url = new URL(urlStr);
  } catch {
    return null;
  }

  const hostname = url.hostname.replace(/^www\./, '');
  const pathname = url.pathname;

  // Check if URL contains an address pattern
  const hasAddressPattern = ADDRESS_PATTERNS.some(p => pathname.includes(p));
  if (!hasAddressPattern) return null;

  // Look up chain from domain
  let chain = DOMAIN_TO_CHAIN[hostname];
  if (chain === undefined) {
    // Try matching blockscout subdomains
    if (hostname.endsWith('.blockscout.com')) {
      const sub = hostname.replace('.blockscout.com', '');
      chain = sub;
    } else {
      return { address: null, network: null, unrecognized: hostname };
    }
  }
  if (chain === null) return null; // explicitly skipped domain

  // Extract address from the path
  let address = null;
  for (const pattern of ADDRESS_PATTERNS) {
    const idx = pathname.indexOf(pattern);
    if (idx !== -1) {
      // Extract everything after the pattern
      const remainder = pathname.slice(idx + pattern.length);
      // Take the first path segment (before any /)
      address = remainder.split('/')[0].split('?')[0].split('#')[0];
      break;
    }
  }

  if (!address || address.length < 10) return null;

  return { address, network: chain };
}

function run() {
  const enrichment = JSON.parse(fs.readFileSync(ENRICHMENT_PATH, 'utf8'));
  const unrecognizedDomains = {};
  let protocolsUpdated = 0;
  let contractsAdded = 0;
  let contractsSkippedDup = 0;
  let urlsSkippedNonExplorer = 0;
  let protocolsMissing = 0;

  for (const [immunefiSlug, proto] of Object.entries(enrichment)) {
    if (!proto.contracts || proto.contracts.length === 0) continue;
    const wcSlug = proto.wc_slug;
    if (!wcSlug) continue;

    const protoPath = path.join(PROTOCOLS_DIR, `${wcSlug}.json`);
    if (!fs.existsSync(protoPath)) {
      protocolsMissing++;
      continue;
    }

    const protoJson = JSON.parse(fs.readFileSync(protoPath, 'utf8'));
    const existingContracts = Array.isArray(protoJson.contracts) ? protoJson.contracts : [];

    // Build a dedup set from existing contracts
    const existingKeys = new Set(
      existingContracts.map(c =>
        `${(c.address || '').toLowerCase()}:${(c.network || '').toLowerCase()}`
      )
    );

    const newContracts = [];

    for (const entry of proto.contracts) {
      if (!entry.url) continue;

      const parsed = parseExplorerUrl(entry.url);
      if (!parsed) {
        urlsSkippedNonExplorer++;
        continue;
      }

      if (parsed.unrecognized) {
        unrecognizedDomains[parsed.unrecognized] = (unrecognizedDomains[parsed.unrecognized] || 0) + 1;
        continue;
      }

      const key = `${parsed.address.toLowerCase()}:${parsed.network.toLowerCase()}`;
      if (existingKeys.has(key)) {
        contractsSkippedDup++;
        continue;
      }

      existingKeys.add(key);
      newContracts.push({
        address: parsed.address,
        network: parsed.network,
        name: entry.description || 'Contract',
        type: 'Bounty Scope',
      });
    }

    if (newContracts.length > 0) {
      protoJson.contracts = [...existingContracts, ...newContracts];
      fs.writeFileSync(protoPath, JSON.stringify(protoJson, null, 2) + '\n');
      protocolsUpdated++;
      contractsAdded += newContracts.length;
    }
  }

  console.log('\n=== Immunefi Contract Enrichment Summary ===');
  console.log(`Protocols updated:       ${protocolsUpdated}`);
  console.log(`Contracts added:         ${contractsAdded}`);
  console.log(`Duplicates skipped:      ${contractsSkippedDup}`);
  console.log(`Non-explorer URLs:       ${urlsSkippedNonExplorer}`);
  console.log(`Protocols not found:     ${protocolsMissing}`);

  if (Object.keys(unrecognizedDomains).length > 0) {
    console.log('\nUnrecognized explorer domains:');
    const sorted = Object.entries(unrecognizedDomains).sort((a, b) => b[1] - a[1]);
    for (const [domain, count] of sorted) {
      console.log(`  ${count}x ${domain}`);
    }
  }
}

run();
