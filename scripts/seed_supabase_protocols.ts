/**
 * Seed Supabase with enriched protocol data from ALL data sources.
 *
 * Usage:
 *   SUPABASE_URL=xxx SUPABASE_KEY=xxx npx tsx scripts/seed_supabase_protocols.ts
 *   SUPABASE_URL=xxx SUPABASE_KEY=xxx npx tsx scripts/seed_supabase_protocols.ts --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { mergeAllSources, type MergedProtocol } from './merge_enrichment_sources';

const DRY_RUN = process.argv.includes('--dry-run');

function immunefiSlugFromName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/\s+/g, '');
}

async function run() {
  const data = mergeAllSources();
  console.log(`\nLoaded ${data.size} protocols from 9 data sources.`);
  if (DRY_RUN) console.log('🏁  DRY RUN — no Supabase writes\n');

  // ── stats ──
  let twCount = 0, emailCount = 0, ghCount = 0, webCount = 0, contractCount = 0, cgCount = 0;
  let totalContracts = 0;
  for (const p of data.values()) {
    if (p.twitter) twCount++;
    if (p.contact_email || p.security_email) emailCount++;
    if (p.github_url) ghCount++;
    if (p.website_url) webCount++;
    if (p.contracts.length > 0) { contractCount++; totalContracts += p.contracts.length; }
    if (p.coingecko_id) cgCount++;
  }

  console.log(`── Column Coverage ──`);
  console.log(`  Twitter:     ${twCount} (${(twCount / data.size * 100).toFixed(1)}%)`);
  console.log(`  Emails:      ${emailCount} (${(emailCount / data.size * 100).toFixed(1)}%)`);
  console.log(`  GitHub:      ${ghCount} (${(ghCount / data.size * 100).toFixed(1)}%)`);
  console.log(`  Website:     ${webCount} (${(webCount / data.size * 100).toFixed(1)}%)`);
  console.log(`  CoinGecko:   ${cgCount} (${(cgCount / data.size * 100).toFixed(1)}%)`);
  console.log(`  Contracts:   ${totalContracts} across ${contractCount} protocols`);
  console.log('');

  if (DRY_RUN) {
    console.log('✅ Dry run complete. No data written.');
    return;
  }

  // ── Supabase connection ──
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error('Set SUPABASE_URL + SUPABASE_KEY'); process.exit(1); }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let seeded = 0, errors = 0;

  for (const [slug, p] of data) {
    // 1. Upsert protocol
    const { data: protocol, error: protoErr } = await supabase
      .from('protocols')
      .upsert({
        slug,
        name: p.name,
        description: p.description,
        category: p.category,
        chains: p.chains,
        logo_url: p.logo_url,
        website_url: p.website_url,
        github_url: p.github_url,
        docs_url: p.docs_url,
        contact_email: p.contact_email,
        security_email: p.security_email,
        twitter: p.twitter,
        discord: p.discord,
        telegram: p.telegram,
        legal_email: p.legal_email,
        whitepaper_url: p.whitepaper_url,
        bounty_policy_url: p.bounty_policy_url,
        developer_docs_url: p.developer_docs_url,
        status_page_url: p.status_page_url,
        reddit_url: p.reddit_url,
        blog_url: p.blog_url,
        coingecko_id: p.coingecko_id,
        market_cap_rank: p.market_cap_rank,
        max_bounty: p.max_bounty,
        immunefi_slug: p.immunefi_slug,
        immunefi_url: p.immunefi_url,
        verified: false,
        claimed: false,
      }, { onConflict: 'slug' })
      .select('id, slug')
      .single();

    if (protoErr) { console.error(`  ❌ ${slug}: ${protoErr.message}`); errors++; continue; }

    // 2. Upsert program with severity payouts
    const sp = p.severity_payouts || {};
    let minPayout = 100, maxPayout = p.max_bounty || 10000;
    for (const tier of ['low', 'medium', 'high', 'critical'] as const) {
      const val = sp[tier];
      if (!val) continue;
      if (typeof val === 'number') { if (!minPayout) minPayout = val; maxPayout = val; }
      else if (typeof val === 'object') { if (val.min && !minPayout) minPayout = val.min; if (val.max) maxPayout = val.max; }
    }

    const { data: program, error: progErr } = await supabase
      .from('programs')
      .upsert({
        protocol_id: protocol.id,
        status: 'active',
        scope_version: 1,
        poc_required: p.poc_required,
        kyc_required: p.kyc_required,
        payout_currency: 'USDC',
        min_payout: minPayout,
        max_payout: maxPayout,
        duplicate_policy: 'first_reporter',
        response_sla_hours: 72,
        cooldown_hours: 24,
        exclusions: p.known_issues,
      }, { onConflict: 'protocol_id' })
      .select('id')
      .single();

    if (progErr) { console.error(`  ⚠️ ${slug} program: ${progErr.message}`); }

    // 3. Upsert scope with merged & deduped contracts
    if (program) {
      const scopeContracts = p.contracts.map(c => ({
        name: c.name || 'Contract',
        address: c.address,
        chain: c.chain || 'ethereum',
      }));

      await supabase.from('program_scopes').upsert({
        program_id: program.id,
        version: 1,
        contracts: scopeContracts,
        in_scope: p.scope.in_scope,
        out_of_scope: p.scope.out_of_scope,
        severity_definitions: p.severity_payouts || {},
      }, { onConflict: 'program_id,version' }).select('id').single();
    }

    seeded++;
    if (seeded % 50 === 0) console.log(`  ... ${seeded}/${data.size}`);
  }

  console.log(`\n✅ Seeded: ${seeded}, Errors: ${errors}, Total: ${data.size}`);
}

run().catch(console.error);
