const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const INDEX_PATH = path.join(ROOT, 'data', 'whiteclaws_protocol_index.json');
const CONTACTS_PATH = path.join(ROOT, 'data', 'protocol_contacts.json');
const SOURCES_PATH = path.join(ROOT, 'data', 'protocol_contacts_sources.json');
const PROTOCOLS_DIR = path.join(ROOT, 'public', 'protocols');

function today() {
  return new Date().toISOString().slice(0, 10);
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function findUrlsFromValue(value) {
  if (typeof value !== 'string') return [];
  const matches = value.match(/https?:\/\/[^\s)\]"']+/g) || [];
  return matches.map((m) => m.replace(/[.,;]$/, ''));
}

function collectUrls(obj, bucket = []) {
  if (obj == null) return bucket;
  if (typeof obj === 'string') {
    bucket.push(...findUrlsFromValue(obj));
    return bucket;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) collectUrls(item, bucket);
    return bucket;
  }
  if (typeof obj === 'object') {
    for (const value of Object.values(obj)) collectUrls(value, bucket);
  }
  return bucket;
}

function parseEmailCandidates(text) {
  if (!text) return [];
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  return uniq(matches.map((m) => m.toLowerCase()));
}

function parseSecurityTxt(body) {
  const lines = body.split(/\r?\n/);
  const parsed = { contacts: [], encryption: [], policy: [] };
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === 'contact') parsed.contacts.push(value);
    if (key === 'encryption') parsed.encryption.push(value);
    if (key === 'policy') parsed.policy.push(value);
  }
  return parsed;
}

async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'whiteclaws-contact-enricher/1.0' },
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, url: response.url, text };
  } catch (error) {
    return { ok: false, status: 0, error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

function classifyPortal(url) {
  const lower = url.toLowerCase();
  if (lower.includes('hackerone')) return 'hackerone';
  if (lower.includes('cantina')) return 'cantina';
  if (lower.includes('code4rena')) return 'code4rena';
  if (lower.includes('immunefi')) return 'immunefi';
  return 'other';
}

function deriveDomainCandidates(protocol) {
  const candidates = [];
  const direct = [protocol.website, protocol.website_url, protocol.url, protocol.docs, protocol.docs_url, protocol.external_url];
  for (const value of direct) {
    if (typeof value === 'string' && /^https?:\/\//.test(value)) candidates.push(value);
  }
  if (typeof protocol.logo_url === 'string' && /^https?:\/\//.test(protocol.logo_url)) candidates.push(protocol.logo_url);
  const allUrls = collectUrls(protocol);
  candidates.push(...allUrls.filter((u) => !u.includes('immunefi.com/bug-bounty/')));

  const normalized = uniq(candidates)
    .map((url) => {
      try {
        const parsed = new URL(url);
        return `${parsed.protocol}//${parsed.host}`;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const preferred = normalized.find((u) => !u.includes('images.ctfassets.net')) || normalized[0] || null;
  return { preferred, alternatives: normalized.filter((u) => u !== preferred) };
}

async function enrichOne(entry) {
  const filePath = path.join(ROOT, entry.filepath);
  let protocol = null;
  try {
    protocol = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }

  const slug = protocol.slug || entry.slug;
  if (!slug) return null;
  const name = protocol.name || entry.name || slug;

  const fieldSources = {};
  const addSource = (field, url) => {
    if (!url) return;
    fieldSources[field] = fieldSources[field] || [];
    fieldSources[field].push(url);
  };

  const contacts = {
    security_emails: [],
    contact_form_url: null,
    pgp_key_url: null,
    security_txt_url: null,
  };

  let preferred = 'direct';
  const portal = { required: false, type: null, url: null };
  const fallback = { immunefi_url: null };
  let policyUrl = null;
  let confidence = 0.3;

  const domainInfo = deriveDomainCandidates(protocol);
  const domainCandidates = domainInfo.preferred ? [domainInfo.preferred, ...domainInfo.alternatives] : [];
  let domainUncertain = !domainInfo.preferred;

  for (const domain of domainCandidates.slice(0, 2)) {
    for (const endpoint of ['/.well-known/security.txt', '/security.txt']) {
      const target = `${domain}${endpoint}`;
      const res = await fetchWithTimeout(target, 3000);
      if (!res.ok) continue;
      const parsed = parseSecurityTxt(res.text || '');
      const securitySource = res.url || target;
      contacts.security_txt_url = securitySource;
      addSource('contacts.security_txt_url', securitySource);
      confidence += 0.4;

      for (const contact of parsed.contacts) {
        if (contact.toLowerCase().startsWith('mailto:')) {
          const email = contact.slice('mailto:'.length).trim().toLowerCase();
          contacts.security_emails.push(email);
          addSource('contacts.security_emails', securitySource);
        } else if (/^https?:\/\//.test(contact) && !contacts.contact_form_url) {
          contacts.contact_form_url = contact;
          addSource('contacts.contact_form_url', securitySource);
        }
      }

      for (const encryption of parsed.encryption) {
        if (!contacts.pgp_key_url && /^https?:\/\//.test(encryption)) {
          contacts.pgp_key_url = encryption;
          addSource('contacts.pgp_key_url', securitySource);
        }
      }

      if (!policyUrl && parsed.policy[0]) {
        policyUrl = parsed.policy[0];
        addSource('policy_url', securitySource);
      }
      break;
    }
    if (contacts.security_txt_url) break;
  }

  const candidateUrls = uniq(collectUrls(protocol));
  const securityLikeUrls = candidateUrls.filter((u) => /(security|responsible-disclosure|bug-bounty|vulnerability|disclosure)/i.test(u));

  if (!policyUrl && securityLikeUrls.length > 0) {
    policyUrl = securityLikeUrls[0];
    addSource('policy_url', securityLikeUrls[0]);
    confidence += 0.2;
  }

  const rules = Array.isArray(protocol.program_rules) ? protocol.program_rules : [];
  for (const rule of rules) {
    const lower = String(rule).toLowerCase();
    const urls = findUrlsFromValue(String(rule));
    const emails = parseEmailCandidates(String(rule));

    for (const email of emails) {
      contacts.security_emails.push(email);
      addSource('contacts.security_emails', entry.filepath);
    }

    if ((lower.includes('submit only via') || lower.includes('do not accept direct') || lower.includes('must be reported through')) && urls.length > 0) {
      portal.required = true;
      portal.url = urls[0];
      portal.type = classifyPortal(urls[0]);
      preferred = 'portal';
      addSource('portal.url', entry.filepath);
      addSource('portal.type', entry.filepath);
    }
  }

  const immunefiCandidates = candidateUrls.filter((u) => /immunefi\.com\//i.test(u));
  if (!contacts.security_emails.length && !contacts.contact_form_url && !policyUrl && !portal.required && immunefiCandidates.length > 0) {
    fallback.immunefi_url = immunefiCandidates[0];
    preferred = 'portal';
    portal.required = true;
    portal.type = 'immunefi';
    portal.url = immunefiCandidates[0];
    addSource('fallback.immunefi_url', immunefiCandidates[0]);
    addSource('portal.url', immunefiCandidates[0]);
    addSource('portal.type', immunefiCandidates[0]);
  }

  if (!domainInfo.preferred) confidence -= 0.3;
  if (contacts.security_txt_url) {
    domainUncertain = false;
  }

  contacts.security_emails = uniq(contacts.security_emails);

  const sourceSet = new Set();
  for (const values of Object.values(fieldSources)) {
    for (const value of values) sourceSet.add(value);
  }

  const conflictingEmails = contacts.security_emails.length > 1;
  const finalConfidence = Math.max(0, Math.min(1, Number(confidence.toFixed(2))));
  const needsReview = finalConfidence < 0.7 || conflictingEmails || domainUncertain || entry.needs_review;

  return {
    slug,
    name,
    domain: {
      preferred: domainInfo.preferred,
      alternatives: domainInfo.alternatives,
      confidence: domainInfo.preferred ? 0.6 : 0,
      sources: domainInfo.preferred ? [entry.filepath] : [],
      uncertain: domainUncertain,
    },
    disclosure: {
      preferred,
      contacts,
      policy_url: policyUrl,
      portal,
      fallback,
      sources: [...sourceSet],
      last_verified: today(),
      needs_review: Boolean(needsReview),
      confidence: finalConfidence,
    },
    field_sources: Object.fromEntries(Object.entries(fieldSources).map(([k, v]) => [k, uniq(v)])),
  };
}

async function run() {
  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error(`Missing index file: ${INDEX_PATH}. Run extract_protocol_slugs first.`);
  }

  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const protocols = index.protocols || [];

  const contacts = {};
  const sources = {};

  for (const entry of protocols) {
    if (!entry.filepath || !entry.filepath.startsWith('public/protocols/')) continue;
    const enriched = await enrichOne(entry);
    if (!enriched) continue;
    contacts[enriched.slug] = {
      slug: enriched.slug,
      name: enriched.name,
      domain: enriched.domain,
      disclosure: enriched.disclosure,
    };
    sources[enriched.slug] = enriched.field_sources;
  }

  const orderedContacts = Object.fromEntries(Object.entries(contacts).sort(([a], [b]) => a.localeCompare(b)));
  const orderedSources = Object.fromEntries(Object.entries(sources).sort(([a], [b]) => a.localeCompare(b)));

  fs.mkdirSync(path.dirname(CONTACTS_PATH), { recursive: true });
  fs.writeFileSync(CONTACTS_PATH, `${JSON.stringify(orderedContacts, null, 2)}\n`, 'utf8');
  fs.writeFileSync(SOURCES_PATH, `${JSON.stringify(orderedSources, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${CONTACTS_PATH} (${Object.keys(orderedContacts).length} protocols)`);
  console.log(`Wrote ${SOURCES_PATH}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
