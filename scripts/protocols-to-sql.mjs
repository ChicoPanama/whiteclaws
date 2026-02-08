#!/usr/bin/env node
/**
 * Convert protocol JSON files to Supabase SQL insert statements
 * Usage: node protocols-to-sql.mjs [protocol-slug]
 * Without args: processes all protocols in data/protocols/
 */

import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join, basename } from "path";

const PROTOCOLS_DIR = "./data/protocols";
const OUTPUT_DIR = "./supabase/protocol_inserts";

function escapeSql(str) {
  if (!str) return "";
  return str.replace(/'/g, "''").replace(/\\/g, "\\\\");
}

function generateProtocolInsert(json) {
  const p = json;
  return `-- ${p.protocol_name}
INSERT INTO protocols (
  name, slug, description, immunefi_url, chains, max_bounty, min_bounty,
  tvl, severity_payouts, kyc_required, scope_details, contracts_detailed,
  assets, known_issues, program_rules, documentation_urls, languages,
  audit_history, previous_hacks, launch_date, tvl_verified, is_active, last_synced_at
) VALUES (
  '${escapeSql(p.metadata.name)}',
  '${escapeSql(p.slug)}',
  '${escapeSql(p.metadata.description)}',
  '${escapeSql(p.metadata.website)}',
  ARRAY[${p.assets.chains.map(c => `'${c}'`).join(", ")}],
  ${p.bounty.max_bounty_usd},
  ${p.bounty.min_bounty_usd},
  ${p.assets.tvl.total},
  '${escapeSql(JSON.stringify(p.severity))}'::jsonb,
  ${p.bounty.kyc_required},
  '${escapeSql(JSON.stringify({
    in_scope: p.scope.in_scope,
    out_of_scope: p.scope.out_of_scope,
    summary: p.scope.in_scope_summary
  }))}'::jsonb,
  '${escapeSql(JSON.stringify(p.scope.contracts))}'::jsonb,
  '${escapeSql(JSON.stringify(p.assets.tokens))}'::jsonb,
  '${escapeSql(p.scope.out_of_scope.join("; "))}',
  '${escapeSql(JSON.stringify(p.bounty.program_rules))}'::jsonb,
  ARRAY[${p.metadata.documentation.map(d => `'${escapeSql(d)}'`).join(", ")}],
  ARRAY['solidity'],
  '${escapeSql(JSON.stringify(p.audit_history))}'::jsonb,
  '${escapeSql(JSON.stringify(p.previous_hacks))}'::jsonb,
  '${p.metadata.launch_date || null}',
  ${p.assets.tvl.verified},
  true,
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  severity_payouts = EXCLUDED.severity_payouts,
  scope_details = EXCLUDED.scope_details,
  contracts_detailed = EXCLUDED.contracts_detailed,
  assets = EXCLUDED.assets,
  last_synced_at = NOW();

-- Contracts for ${p.protocol_name}
${p.scope.contracts.map(c => `
INSERT INTO protocol_contracts (
  protocol_id, network, address, name, description, in_scope, lines_of_code, functions, modifiers, is_upgradeable
) SELECT 
  id, '${c.network}', '${c.address}', '${escapeSql(c.name)}', '${escapeSql(c.description)}',
  ${c.in_scope}, ${c.lines_of_code || 'NULL'},
  '${escapeSql(JSON.stringify(c.functions || []))}'::jsonb,
  '${escapeSql(JSON.stringify([]))}'::jsonb,
  ${c.upgradeable || false}
FROM protocols WHERE slug = '${p.slug}'
ON CONFLICT DO NOTHING;
`).join("")}
`;
}

// Main
function main() {
  const files = readdirSync(PROTOCOLS_DIR)
    .filter(f => f.endsWith(".json") && !f.startsWith("_"));

  let allSql = "-- Auto-generated protocol inserts\n-- Generated: " + new Date().toISOString() + "\n\n";

  for (const file of files) {
    try {
      const json = JSON.parse(readFileSync(join(PROTOCOLS_DIR, file), "utf8"));
      allSql += generateProtocolInsert(json) + "\n\n";
      console.log(`✅ Processed: ${file}`);
    } catch (e) {
      console.error(`❌ Error processing ${file}:`, e.message);
    }
  }

  const outputFile = `${OUTPUT_DIR}/all-protocols.sql`;
  try {
    require("fs").mkdirSync(OUTPUT_DIR, { recursive: true });
  } catch {}
  
  writeFileSync(outputFile, allSql);
  console.log(`\n💾 SQL saved to: ${outputFile}`);
  console.log(`📊 Protocols processed: ${files.length}`);
}

main();
