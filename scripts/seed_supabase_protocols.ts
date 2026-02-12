/**
 * Seed Supabase with enriched protocol data.
 * Run: SUPABASE_URL=xxx SUPABASE_KEY=xxx npx tsx scripts/seed_supabase_protocols.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const PROTOCOLS_DIR = path.join(ROOT, 'public', 'protocols');
const DOMAINS_PATH = path.join(ROOT, 'data', 'protocol_domains.json');
const CONTACTS_PATH = path.join(ROOT, 'data', 'protocol_contacts.json');
const CONTRACTS_PATH = path.join(ROOT, 'data', 'protocol_contracts.json');

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Set SUPABASE_URL + SUPABASE_KEY'); process.exit(1); }

const supabase = createClient(url, key, { auth: { persistSession: false } });

function loadJSON(p: string): any {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

function extractMaxBounty(proto: any): number {
  const sp = proto.severity_payouts || {};
  for (const tier of ['critical', 'high', 'medium', 'low']) {
    const val = sp[tier];
    if (!val) continue;
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && val.max) return val.max;
    if (typeof val === 'string') {
      const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
      if (num > 0) return num;
    }
  }
  return proto.max_bounty || 0;
}

function extractPayoutRange(proto: any): { min: number; max: number } {
  const sp = proto.severity_payouts || {};
  let min = 0, max = 0;
  for (const tier of ['low', 'medium', 'high', 'critical']) {
    const val = sp[tier];
    if (!val) continue;
    if (typeof val === 'number') { if (!min) min = val; max = val; }
    else if (typeof val === 'object') { if (!min && val.min) min = val.min; if (val.max) max = val.max; }
  }
  return { min: min || 100, max: max || 10000 };
}

function immunefiSlugFromName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/\s+/g, '');
}

async function run() {
  const domains = loadJSON(DOMAINS_PATH);
  const contacts = loadJSON(CONTACTS_PATH);
  const contractsData = loadJSON(CONTRACTS_PATH);

  const files = fs.readdirSync(PROTOCOLS_DIR)
    .filter(f => f.endsWith('.json') && f !== '_index.json' && f !== 'protocol_template.json')
    .sort();

  console.log(`Seeding ${files.length} protocols...`);
  let seeded = 0, errors = 0;

  for (const file of files) {
    const proto = loadJSON(path.join(PROTOCOLS_DIR, file));
    const slug = proto.slug || file.replace('.json', '');
    const domain = domains[slug];
    const contact = contacts[slug];
    const contractInfo = contractsData[slug];

    // 1. Upsert protocol
    const websiteUrl = domain?.url || null;
    const contactEmail = contact?.disclosure?.contacts?.security_emails?.[0] || null;
    const immunefiUrl = contact?.disclosure?.fallback?.immunefi_url || null;
    const maxBounty = extractMaxBounty(proto);

    const { data: protocol, error: protoErr } = await supabase
      .from('protocols')
      .upsert({
        slug,
        name: proto.name || slug,
        description: proto.description || null,
        category: proto.category || null,
        chains: proto.chains || proto.chains_supported || null,
        logo_url: proto.logo_url || null,
        website_url: websiteUrl,
        contact_email: contactEmail,
        security_email: contactEmail,
        max_bounty: maxBounty,
        immunefi_slug: immunefiSlugFromName(proto.name || slug),
        immunefi_url: immunefiUrl || `https://immunefi.com/bug-bounty/${immunefiSlugFromName(proto.name || slug)}`,
        verified: false,
        claimed: false,
      }, { onConflict: 'slug' })
      .select('id, slug')
      .single();

    if (protoErr) { console.error(`  ❌ ${slug}: ${protoErr.message}`); errors++; continue; }

    // 2. Create program (upsert by protocol_id)
    const payout = extractPayoutRange(proto);
    const { data: program, error: progErr } = await supabase
      .from('programs')
      .upsert({
        protocol_id: protocol.id,
        status: 'active',
        scope_version: 1,
        poc_required: proto.poc_required || false,
        kyc_required: proto.eligibility?.kyc === true || false,
        payout_currency: 'USDC',
        min_payout: payout.min,
        max_payout: payout.max,
        duplicate_policy: 'first_reporter',
        response_sla_hours: 72,
        cooldown_hours: 24,
        exclusions: proto.known_issues || [],
      }, { onConflict: 'protocol_id' })
      .select('id')
      .single();

    if (progErr) { console.error(`  ⚠️ ${slug} program: ${progErr.message}`); }

    // 3. Create scope
    if (program) {
      const contracts = contractInfo?.contracts?.map((c: any) => ({
        name: c.label || 'Contract',
        address: c.address,
        chain: c.chain || 'ethereum',
      })) || [];

      const scopeData = proto.scope || {};
      const inScope = Array.isArray(scopeData.in_scope) ? scopeData.in_scope :
                      typeof scopeData.in_scope === 'string' ? [scopeData.in_scope] : [];
      const outOfScope = Array.isArray(scopeData.out_of_scope) ? scopeData.out_of_scope : [];

      await supabase.from('program_scopes').upsert({
        program_id: program.id,
        version: 1,
        contracts,
        in_scope: inScope,
        out_of_scope: outOfScope,
        severity_definitions: proto.severity_payouts || {},
      }, { onConflict: 'program_id,version' }).select('id').single();
    }

    seeded++;
    if (seeded % 50 === 0) console.log(`  ... ${seeded}/${files.length}`);
  }

  console.log(`\n✅ Seeded: ${seeded}, Errors: ${errors}, Total: ${files.length}`);
}

run().catch(console.error);
