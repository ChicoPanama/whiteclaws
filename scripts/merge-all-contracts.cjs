#!/usr/bin/env node
/**
 * Phase 3: Merge Deployer-Discovered Contracts into Protocol JSONs
 *
 * Reads data/deployer_discovered_contracts.json and merges new contracts
 * into public/protocols/{slug}.json files.
 *
 * Dedup rules:
 * - Existing contracts (any type) take priority
 * - Only genuinely new addresses are added with type "Out of Scope"
 *
 * Usage: node scripts/merge-all-contracts.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DISCOVERED_PATH = path.join(ROOT, 'data', 'deployer_discovered_contracts.json');
const PROTOCOLS_DIR = path.join(ROOT, 'public', 'protocols');

function run() {
  if (!fs.existsSync(DISCOVERED_PATH)) {
    console.error(`Missing ${DISCOVERED_PATH}`);
    console.error('Run scripts/discover-deployer-contracts.cjs first.');
    process.exit(1);
  }

  const discovered = JSON.parse(fs.readFileSync(DISCOVERED_PATH, 'utf8'));
  let protocolsUpdated = 0;
  let contractsAdded = 0;
  let contractsSkippedDup = 0;

  for (const [slug, newContracts] of Object.entries(discovered)) {
    const protoPath = path.join(PROTOCOLS_DIR, `${slug}.json`);
    if (!fs.existsSync(protoPath)) {
      console.warn(`Protocol file not found: ${protoPath}`);
      continue;
    }

    const protoJson = JSON.parse(fs.readFileSync(protoPath, 'utf8'));
    const existingContracts = Array.isArray(protoJson.contracts) ? protoJson.contracts : [];

    // Build dedup set from existing contracts
    const existingKeys = new Set(
      existingContracts.map(c =>
        `${(c.address || '').toLowerCase()}:${(c.network || '').toLowerCase()}`
      )
    );

    const toAdd = [];

    for (const nc of newContracts) {
      const key = `${nc.address.toLowerCase()}:${(nc.network || '').toLowerCase()}`;
      if (existingKeys.has(key)) {
        contractsSkippedDup++;
        continue;
      }
      existingKeys.add(key);
      toAdd.push({
        address: nc.address,
        network: nc.network,
        name: nc.name || 'Deployed Contract',
        type: 'Out of Scope',
      });
    }

    if (toAdd.length > 0) {
      protoJson.contracts = [...existingContracts, ...toAdd];
      fs.writeFileSync(protoPath, JSON.stringify(protoJson, null, 2) + '\n');
      protocolsUpdated++;
      contractsAdded += toAdd.length;
    }
  }

  console.log('\n=== Merge All Contracts Summary ===');
  console.log(`Protocols updated:       ${protocolsUpdated}`);
  console.log(`Contracts added:         ${contractsAdded}`);
  console.log(`Duplicates skipped:      ${contractsSkippedDup}`);
}

run();
