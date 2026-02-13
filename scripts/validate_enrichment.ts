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
  const domains = JSON.parse(fs.readFileSync(DOMAINS, 'utf8')) as Record<string, { domain: string | null; reason: string | null; method?: string }>;
  const contacts = JSON.parse(fs.readFileSync(CONTACTS, 'utf8')) as Record<string, { disclosure: any }>;
  const contactSources = JSON.parse(fs.readFileSync(CONTACT_SOURCES, 'utf8')) as Record<string, Record<string, string[]>>;
  const contracts = JSON.parse(fs.readFileSync(CONTRACTS, 'utf8')) as Record<string, { contracts: any[] }>;
  const contractSources = JSON.parse(fs.readFileSync(CONTRACT_SOURCES, 'utf8')) as Record<string, Record<string, string[]>>;

  const errors: string[] = [];
  const domainMethods: Record<string, number> = {};
  const reasons: Record<string, number> = {};

  // Domain checks
  let domainsResolved = 0;
  for (const [slug, d] of Object.entries(domains)) {
    if (d.domain) {
      domainsResolved++;
      const method = (d as any).method ?? 'unknown';
      domainMethods[method] = (domainMethods[method] ?? 0) + 1;
      if (deny.deny_exact.includes(d.domain) || deny.deny_contains.some((token) => d.domain!.includes(token))) {
        fail(`denylisted domain selected: ${slug} -> ${d.domain}`, errors);
      }
    } else {
      reasons[d.reason ?? 'domain_unresolved'] = (reasons[d.reason ?? 'domain_unresolved'] ?? 0) + 1;
    }
  }

  // Contact checks
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

    // Provenance checks for fields with data
    const src = contactSources[slug] ?? {};
    if ((d.contacts?.security_emails?.length ?? 0) > 0 && (src['contacts.security_emails']?.length ?? 0) === 0) {
      fail(`missing provenance for ${slug} contacts.security_emails`, errors);
    }
    const checks: Array<[string, unknown]> = [
      ['contacts.security_txt_url', d.contacts?.security_txt_url],
      ['contacts.contact_form_url', d.contacts?.contact_form_url],
      ['contacts.pgp_key_url', d.contacts?.pgp_key_url],
      ['policy_url', d.policy_url],
      ['portal.url', d.portal?.url],
      ['fallback.immunefi_url', d.fallback?.immunefi_url],
    ];
    for (const [field, value] of checks) {
      if (value && (src[field]?.length ?? 0) === 0) fail(`missing provenance for ${slug} ${field}`, errors);
    }
  }

  // Contract checks
  const protocolsWithContracts = Object.values(contracts).filter((c) => (c.contracts?.length ?? 0) > 0).length;
  const totalContracts = Object.values(contracts).reduce((sum, c) => sum + (c.contracts?.length ?? 0), 0);
  for (const [slug, row] of Object.entries(contracts)) {
    for (const c of row.contracts ?? []) {
      if (!c.source?.url) fail(`contract source missing url for ${slug}:${c.address}`, errors);
      const m = contractSources[slug]?.[c.address];
      if (!m || m.length === 0) fail(`contract provenance map missing for ${slug}:${c.address}`, errors);
    }
  }

  // TS hygiene - no dynamic require calls
  const tsFiles = [...listTs(path.join(ROOT, 'scripts')), ...listTs(path.join(ROOT, 'lib'))];
  for (const f of tsFiles) {
    const text = fs.readFileSync(f, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
      if (/\brequire\s*\(/.test(trimmed)) fail('dynamic require in ' + path.relative(ROOT, f), errors);
    }
  }

  // CI gate thresholds (realistic after security.txt validation fix)
  if (domainsResolved < 400) fail(`domains_resolved < 400 (${domainsResolved})`, errors);
  if (protocolsWithContracts < 10) fail(`protocols_with_contracts < 10 (${protocolsWithContracts})`, errors);

  const methodTop = Object.entries(domainMethods).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- none';
  const reasonTop = Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- none';

  const lines = [
    '# Enrichment Report',
    '',
    'Generated: ' + new Date().toISOString(),
    '',
    '## Domain Resolution',
    '- total_protocols: ' + Object.keys(domains).length,
    '- domains_resolved: ' + domainsResolved,
    '- unresolved: ' + (Object.keys(domains).length - domainsResolved),
    '',
    '### Resolution methods',
    methodTop,
    '',
    '### Failure reasons',
    reasonTop,
    '',
    '## Contact Enrichment',
    '- direct-ready (security.txt / email / form): ' + directReady,
    '- portal-required: ' + portalRequired,
    '- immunefi-only: ' + immunefiOnly,
    '- no contact info: ' + missing,
    '',
    '## Contract Scope',
    '- protocols_with_contracts: ' + protocolsWithContracts,
    '- total_verified_contracts: ' + totalContracts,
    '',
    '## CI Gate Result',
    errors.length ? 'FAILED' : 'PASSED',
    '',
  ];
  if (errors.length) {
    lines.push('### Errors');
    for (const e of errors) lines.push('- ' + e);
  }
  const report = lines.join('\n') + '\n';

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
