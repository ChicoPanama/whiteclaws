const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTACTS_PATH = path.join(ROOT, 'data', 'protocol_contacts.json');
const INDEX_PATH = path.join(ROOT, 'data', 'whiteclaws_protocol_index.json');
const CSV_PATH = path.join(ROOT, 'data', 'protocol_contacts.csv');
const REPORT_PATH = path.join(ROOT, 'reports', 'contact-db-report.md');

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

async function checkUrl(url) {
  if (!process.env.CONTACT_DB_VALIDATE_REMOTE) {
    return { ok: null, status: null, note: 'skipped (set CONTACT_DB_VALIDATE_REMOTE=1 to enable)' };
  }
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', headers: { 'user-agent': 'whiteclaws-contact-validator/1.0' } });
    return { ok: res.status >= 200 && res.status < 400, status: res.status, note: null };
  } catch (error) {
    return { ok: false, status: 0, note: error.message };
  }
}

async function run() {
  if (!fs.existsSync(CONTACTS_PATH)) throw new Error(`Missing ${CONTACTS_PATH}`);
  if (!fs.existsSync(INDEX_PATH)) throw new Error(`Missing ${INDEX_PATH}`);

  const contacts = JSON.parse(fs.readFileSync(CONTACTS_PATH, 'utf8'));
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));

  const list = Object.values(contacts);
  const indexBySlug = new Map((index.protocols || []).map((p) => [p.slug, p]));

  let directReady = 0;
  let portalRequired = 0;
  let immunefiOnly = 0;
  let missing = 0;

  const missingRows = [];
  const ambiguousRows = [];
  const conflictRows = [];
  const urlChecks = [];

  const csvRows = [
    ['slug', 'name', 'preferred', 'security_emails', 'policy_url', 'portal_type', 'portal_url', 'immunefi_url', 'last_verified', 'confidence', 'needs_review'],
  ];

  for (const item of list) {
    const slug = item.slug;
    const name = item.name;
    const disclosure = item.disclosure || {};
    const contactsObj = disclosure.contacts || {};
    const securityEmails = contactsObj.security_emails || [];

    const invalidEmails = securityEmails.filter((e) => !EMAIL_RE.test(e));
    if (invalidEmails.length > 0) {
      ambiguousRows.push(`- ${slug} (${name}): invalid emails ${invalidEmails.join(', ')}`);
    }

    const hasDirect = securityEmails.length > 0 || Boolean(contactsObj.contact_form_url) || Boolean(disclosure.policy_url);
    const hasPortal = disclosure.portal?.required && disclosure.portal?.url;
    const hasImmunefi = Boolean(disclosure.fallback?.immunefi_url);

    if (hasDirect && disclosure.preferred === 'direct') directReady += 1;
    if (hasPortal) portalRequired += 1;
    if (hasImmunefi && !hasDirect) immunefiOnly += 1;
    if (!hasDirect && !hasPortal && !hasImmunefi) {
      missing += 1;
      const fieldsMissing = ['security_emails/contact_form_url/policy_url'];
      missingRows.push(`- ${slug} (${name}): missing ${fieldsMissing.join(', ')}. Suggestion: verify official website and security policy manually.`);
    }

    if (item.domain?.uncertain || (securityEmails.length > 1)) {
      ambiguousRows.push(`- ${slug} (${name}): uncertain domain or multiple security emails; confidence=${disclosure.confidence}`);
    }

    if (disclosure.preferred === 'direct' && disclosure.portal?.required) {
      conflictRows.push(`- ${slug} (${name}): preferred=direct but portal.required=true`);
    }

    const urlsToCheck = [
      contactsObj.contact_form_url,
      contactsObj.pgp_key_url,
      contactsObj.security_txt_url,
      disclosure.policy_url,
      disclosure.portal?.url,
      disclosure.fallback?.immunefi_url,
    ].filter(Boolean);

    for (const url of urlsToCheck) {
      const result = await checkUrl(url);
      urlChecks.push({ slug, url, ...result });
    }

    csvRows.push([
      slug,
      name,
      disclosure.preferred || 'direct',
      securityEmails.join(';'),
      disclosure.policy_url || '',
      disclosure.portal?.type || '',
      disclosure.portal?.url || '',
      disclosure.fallback?.immunefi_url || '',
      disclosure.last_verified || '',
      String(disclosure.confidence ?? ''),
      String(Boolean(disclosure.needs_review)),
    ]);

    const entry = indexBySlug.get(slug);
    if (entry && !entry.slug) {
      conflictRows.push(`- ${slug}: index entry missing slug`);
    }
  }

  const csv = csvRows.map((row) => row.map(csvEscape).join(',')).join('\n') + '\n';
  fs.writeFileSync(CSV_PATH, csv, 'utf8');

  const urlCheckSummary = {
    ok: urlChecks.filter((c) => c.ok === true).length,
    failed: urlChecks.filter((c) => c.ok === false).length,
    skipped: urlChecks.filter((c) => c.ok === null).length,
  };

  const report = `# Contact DB Validation Report\n\nGenerated: ${new Date().toISOString()}\n\n## Summary\n- Total protocols: ${list.length}\n- Direct-ready: ${directReady}\n- Portal-required: ${portalRequired}\n- Immunefi-only: ${immunefiOnly}\n- Missing: ${missing}\n\n## URL Validation\n- Passed (200/3xx): ${urlCheckSummary.ok}\n- Failed: ${urlCheckSummary.failed}\n- Skipped: ${urlCheckSummary.skipped}\n\n## Missing\n${missingRows.length ? missingRows.join('\n') : '- None'}\n\n## Ambiguous\n${ambiguousRows.length ? ambiguousRows.join('\n') : '- None'}\n\n## Policy conflicts\n${conflictRows.length ? conflictRows.join('\n') : '- None'}\n`;

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, report, 'utf8');

  console.log(`Wrote ${CSV_PATH}`);
  console.log(`Wrote ${REPORT_PATH}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
