import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DENYLIST = path.join(ROOT, 'data', 'domain_denylist.json');
const DOMAINS = path.join(ROOT, 'data', 'protocol_domains.json');
const CONTACTS = path.join(ROOT, 'data', 'protocol_contacts.json');
const CONTACT_SOURCES = path.join(ROOT, 'data', 'protocol_contacts_sources.json');
const CONTRACTS = path.join(ROOT, 'data', 'protocol_contracts.json');
const CONTRACT_SOURCES = path.join(ROOT, 'data', 'protocol_contracts_sources.json');
const REPORT = path.join(ROOT, 'reports', 'enrichment-report.md');

function fail(msg: string, errors: string[]) { errors.push(msg); }

function run() {
  const deny = JSON.parse(fs.readFileSync(DENYLIST, 'utf8')) as { deny_exact: string[]; deny_contains: string[] };
  const domains = JSON.parse(fs.readFileSync(DOMAINS, 'utf8')) as Record<string, { domain: string | null; reason: string | null }>;
  const contacts = JSON.parse(fs.readFileSync(CONTACTS, 'utf8')) as Record<string, { disclosure: any }>;
  const contactSources = JSON.parse(fs.readFileSync(CONTACT_SOURCES, 'utf8')) as Record<string, Record<string, string[]>>;
  const contracts = JSON.parse(fs.readFileSync(CONTRACTS, 'utf8')) as Record<string, { contracts: any[] }>;
  const contractSources = JSON.parse(fs.readFileSync(CONTRACT_SOURCES, 'utf8')) as Record<string, Record<string, string[]>>;

  const errors: string[] = [];
  const reasons: Record<string, number> = {};

  for (const [slug, d] of Object.entries(domains)) {
    if (!d.domain) {
      reasons[d.reason ?? 'domain_unresolved'] = (reasons[d.reason ?? 'domain_unresolved'] ?? 0) + 1;
      continue;
    }
    if (deny.deny_exact.includes(d.domain) || deny.deny_contains.some((token) => d.domain!.includes(token))) {
      fail(`denylisted domain selected: ${slug} -> ${d.domain}`, errors);
    }
  }

  let directReady = 0;
  let portalRequired = 0;
  let immunefiOnly = 0;
  let missing = 0;

  for (const [slug, row] of Object.entries(contacts)) {
    const d = row.disclosure;
    const hasDirect = (d.contacts?.security_emails?.length ?? 0) > 0 || Boolean(d.contacts?.contact_form_url) || Boolean(d.policy_url) || Boolean(d.contacts?.security_txt_url);
    const hasPortal = Boolean(d.portal?.url);
    const hasImmunefi = Boolean(d.fallback?.immunefi_url);
    if (hasDirect) directReady++;
    if (d.portal?.required) portalRequired++;
    if (!hasDirect && hasImmunefi) immunefiOnly++;
    if (!hasDirect && !hasPortal && !hasImmunefi) missing++;

    const src = contactSources[slug] ?? {};
    const checks: Array<[string, unknown]> = [
      ['contacts.security_txt_url', d.contacts?.security_txt_url],
      ['contacts.contact_form_url', d.contacts?.contact_form_url],
      ['contacts.pgp_key_url', d.contacts?.pgp_key_url],
      ['policy_url', d.policy_url],
      ['portal.url', d.portal?.url],
      ['fallback.immunefi_url', d.fallback?.immunefi_url],
    ];

    if ((d.contacts?.security_emails?.length ?? 0) > 0 && (src['contacts.security_emails']?.length ?? 0) === 0) {
      fail(`missing provenance for ${slug} contacts.security_emails`, errors);
    }
    for (const [field, value] of checks) {
      if (value && (src[field]?.length ?? 0) === 0) fail(`missing provenance for ${slug} ${field}`, errors);
    }
  }

  const protocolsWithContracts = Object.values(contracts).filter((c) => (c.contracts?.length ?? 0) > 0).length;
  for (const [slug, row] of Object.entries(contracts)) {
    for (const c of row.contracts ?? []) {
      if (!c.source?.url) fail(`contract source missing url for ${slug}:${c.address}`, errors);
      const m = contractSources[slug]?.[c.address];
      if (!m || m.length === 0) fail(`contract provenance map missing for ${slug}:${c.address}`, errors);
    }
  }

  const tsFiles = [...listTs(path.join(ROOT, 'scripts')), ...listTs(path.join(ROOT, 'lib'))];
  for (const f of tsFiles) {
    const text = fs.readFileSync(f, 'utf8');
    if (/\brequire\(/.test(text)) fail(`require call not allowed in ${path.relative(ROOT, f)}`, errors);
  }

  if (directReady < 10) fail(`direct_ready_protocols < 10 (${directReady})`, errors);
  if (protocolsWithContracts < 10) fail(`protocols_with_contracts < 10 (${protocolsWithContracts})`, errors);

  const reasonTop = Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- none';
  const report = `# Enrichment Report\n\nGenerated: ${new Date().toISOString()}\n\n## Summary\n- total_protocols: ${Object.keys(domains).length}\n- direct-ready: ${directReady}\n- portal-required: ${portalRequired}\n- immunefi-only: ${immunefiOnly}\n- missing: ${missing}\n- protocols_with_contracts: ${protocolsWithContracts}\n\n## Top failure reasons\n${reasonTop}\n\n## CI Gate Result\n${errors.length ? 'FAILED' : 'PASSED'}\n\n${errors.length ? '### Errors\n' + errors.map((e) => `- ${e}`).join('\n') : ''}\n`;

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, report);
  console.log(report);
  if (errors.length) process.exit(1);
}

function listTs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listTs(abs));
    else if (e.isFile() && e.name.endsWith('.ts')) out.push(abs);
  }
  return out;
}

run();
