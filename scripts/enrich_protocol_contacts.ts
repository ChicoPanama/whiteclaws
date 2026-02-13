import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

type Contacts = { security_emails: string[]; contact_form_url: string | null; pgp_key_url: string | null; security_txt_url: string | null };
type Disclosure = { preferred: 'direct' | 'portal'; contacts: Contacts; policy_url: string | null; portal: { required: boolean; type: string | null; url: string | null }; fallback: { immunefi_url: string | null }; sources: string[]; last_verified: string; needs_review: boolean; confidence: number };

const ROOT = process.cwd();
const DOMAINS_PATH = path.join(ROOT, 'data', 'protocol_domains.json');
const CONTACTS_PATH = path.join(ROOT, 'data', 'protocol_contacts.json');
const SOURCES_PATH = path.join(ROOT, 'data', 'protocol_contacts_sources.json');
const CSV_PATH = path.join(ROOT, 'data', 'protocol_contacts.csv');
const INDEX_PATH = path.join(ROOT, 'data', 'whiteclaws_protocol_index.json');

function curlGet(url: string): string | null {
  try {
    return execFileSync('curl', ['-fsSL', '--max-time', '4', '--retry', '0', '-H', 'User-Agent: whiteclaws-enricher/2.0', url], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch { return null; }
}

function uniq<T>(arr: T[]): T[] { return [...new Set(arr)]; }
function today(): string { return new Date().toISOString().slice(0, 10); }

function isValidSecurityTxt(body: string): boolean {
  // RFC 9116: must contain Contact: field, must not be HTML
  if (!body || body.length < 10) return false;
  const lower = body.toLowerCase().trim();
  if (lower.startsWith('<!doctype') || lower.startsWith('<html') || lower.startsWith('<?xml') || lower.includes('<head>') || lower.includes('<body>')) return false;
  // Must have at least one Contact: line
  const lines = body.split(/\r?\n/);
  const hasContact = lines.some(l => /^contact\s*:/i.test(l.trim()));
  return hasContact;
}

function parseSecurityTxt(body: string) {
  const out = { contact: [] as string[], policy: [] as string[], encryption: [] as string[] };
  for (const line of body.split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim().toLowerCase();
    const v = line.slice(i + 1).trim();
    if (!v) continue;
    if (k === 'contact') out.contact.push(v);
    if (k === 'policy') out.policy.push(v);
    if (k === 'encryption') out.encryption.push(v);
  }
  return out;
}

function classifyPortal(url: string): string {
  const l = url.toLowerCase();
  if (l.includes('hackerone')) return 'hackerone';
  if (l.includes('cantina')) return 'cantina';
  if (l.includes('immunefi')) return 'immunefi';
  if (l.includes('code4rena')) return 'code4rena';
  return 'other';
}

function run() {
  const domains = JSON.parse(fs.readFileSync(DOMAINS_PATH, 'utf8')) as Record<string, { slug: string; name: string; domain: string | null; confidence: number }>;
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8')) as { protocols: Array<{ slug: string | null; name: string | null; filepath: string }> };
  const bySlug = new Map(index.protocols.filter((p) => p.slug).map((p) => [p.slug!, p]));

  const maxFetch = Number(process.env.CONTACT_ENRICH_LIMIT ?? '9999');
  const eligible = Object.entries(domains)
    .filter(([, v]) => v.domain && v.confidence >= 0.5)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, maxFetch)
    .map(([k]) => k);
  const eligibleSet = new Set(eligible);

  const contacts: Record<string, { slug: string; name: string; disclosure: Disclosure }> = {};
  const sources: Record<string, Record<string, string[]>> = {};
  const rows = [['slug', 'name', 'preferred', 'security_emails', 'policy_url', 'portal_type', 'portal_url', 'immunefi_url', 'last_verified', 'confidence', 'needs_review']];

  let fetched = 0;
  let secTxtFound = 0;

  for (const [slug, d] of Object.entries(domains)) {
    const src: Record<string, string[]> = {};
    const addSrc = (field: string, url: string) => { src[field] = uniq([...(src[field] ?? []), url]); };

    const disclosure: Disclosure = {
      preferred: 'direct',
      contacts: { security_emails: [], contact_form_url: null, pgp_key_url: null, security_txt_url: null },
      policy_url: null,
      portal: { required: false, type: null, url: null },
      fallback: { immunefi_url: null },
      sources: [],
      last_verified: today(),
      needs_review: true,
      confidence: 0.3,
    };

    // Fetch security.txt with VALIDATION
    if (eligibleSet.has(slug) && d.domain && d.confidence >= 0.5) {
      for (const endpoint of [`https://${d.domain}/.well-known/security.txt`, `https://${d.domain}/security.txt`]) {
        const txt = curlGet(endpoint);
        fetched++;
        if (!txt) continue;

        // CRITICAL FIX: Validate this is actually security.txt, not an SPA HTML page
        if (!isValidSecurityTxt(txt)) continue;

        const parsed = parseSecurityTxt(txt);
        disclosure.contacts.security_txt_url = endpoint;
        addSrc('contacts.security_txt_url', endpoint);
        disclosure.confidence += 0.4;
        secTxtFound++;

        for (const c of parsed.contact) {
          if (c.toLowerCase().startsWith('mailto:')) {
            const em = c.slice(7).trim().toLowerCase();
            disclosure.contacts.security_emails.push(em);
            addSrc('contacts.security_emails', endpoint);
          } else if (/^https?:\/\//i.test(c) && !disclosure.contacts.contact_form_url) {
            disclosure.contacts.contact_form_url = c;
            addSrc('contacts.contact_form_url', endpoint);
          }
        }
        if (!disclosure.policy_url && parsed.policy[0]) {
          disclosure.policy_url = parsed.policy[0];
          addSrc('policy_url', endpoint);
        }
        if (!disclosure.contacts.pgp_key_url && parsed.encryption[0]) {
          disclosure.contacts.pgp_key_url = parsed.encryption[0];
          addSrc('contacts.pgp_key_url', endpoint);
        }
        break;
      }
    }

    // Fallback: check protocol JSON for immunefi URLs
    const idx = bySlug.get(slug);
    if (idx?.filepath) {
      try {
        const raw = fs.readFileSync(path.join(ROOT, idx.filepath), 'utf8');
        const immunefi = raw.match(/https?:\/\/[^"'\s]*immunefi\.com\/bug-bounty\/[^"'\s]*/i)?.[0] ?? null;
        if (!disclosure.contacts.security_emails.length && !disclosure.policy_url && !disclosure.portal.url && immunefi) {
          disclosure.fallback.immunefi_url = immunefi;
          disclosure.preferred = 'portal';
          disclosure.portal.required = true;
          disclosure.portal.type = 'immunefi';
          disclosure.portal.url = immunefi;
          addSrc('fallback.immunefi_url', idx.filepath);
          addSrc('portal.url', idx.filepath);
          addSrc('portal.type', idx.filepath);
        }
      } catch {}
    }

    disclosure.contacts.security_emails = uniq(disclosure.contacts.security_emails);
    disclosure.confidence = Math.max(0, Math.min(1, Number(disclosure.confidence.toFixed(2))));
    const hasIntake = disclosure.contacts.security_emails.length > 0 || !!disclosure.contacts.contact_form_url || !!disclosure.policy_url || !!disclosure.contacts.security_txt_url || !!disclosure.portal.url || !!disclosure.fallback.immunefi_url;
    disclosure.needs_review = !(disclosure.confidence >= 0.7 && hasIntake);
    disclosure.sources = uniq(Object.values(src).flat());

    contacts[slug] = { slug, name: d.name, disclosure };
    sources[slug] = src;
    rows.push([slug, d.name, disclosure.preferred, disclosure.contacts.security_emails.join(';'), disclosure.policy_url ?? '', disclosure.portal.type ?? '', disclosure.portal.url ?? '', disclosure.fallback.immunefi_url ?? '', disclosure.last_verified, String(disclosure.confidence), String(disclosure.needs_review)]);
  }

  fs.writeFileSync(CONTACTS_PATH, `${JSON.stringify(contacts, null, 2)}\n`);
  fs.writeFileSync(SOURCES_PATH, `${JSON.stringify(sources, null, 2)}\n`);
  fs.writeFileSync(CSV_PATH, `${rows.map((r) => r.map((x) => (String(x).includes(',') ? `"${String(x).replaceAll('"', '""')}"` : String(x))).join(',')).join('\n')}\n`);

  console.log(`wrote ${CONTACTS_PATH} — fetched ${fetched} URLs, found ${secTxtFound} valid security.txt files`);
}

run();
