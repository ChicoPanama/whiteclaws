#!/usr/bin/env node

/**
 * Website Protocol Intelligence Scraper
 * ========================================
 * Scrapes protocol websites for everything a bounty hunter needs.
 * This goes BEYOND what Immunefi provides — full hunter toolkit.
 *
 * For each protocol domain, extracts:
 *
 *   CONTACTS (security + general)
 *   - security.txt (RFC 9116) → security email, PGP key, policy URL
 *   - Homepage mailto: links → security@, contact@, team@, legal@
 *   - /security, /bug-bounty pages → dedicated disclosure email
 *   - /terms, /legal, /privacy → legal contact email
 *
 *   SOCIAL LINKS
 *   - Twitter/X handle (footer + meta twitter:site)
 *   - Discord invite link
 *   - Telegram group
 *   - GitHub org
 *   - Reddit / Medium / Blog
 *
 *   DOCUMENTATION (Immunefi doesn't give hunters this)
 *   - Docs URL (docs.{domain}, /docs, footer "Documentation" link)
 *   - Developer docs URL
 *   - Whitepaper URL
 *
 *   AUDIT HISTORY (hunters use this to find gaps)
 *   - Audit report links found on /security, /audits pages
 *   - Auditor names extracted from page text
 *   - Security page URL
 *
 *   BUG BOUNTY POLICY
 *   - Protocol's own bounty page URL (not just Immunefi)
 *   - Responsible disclosure page URL
 *   - Scope info URL
 *
 *   INFRASTRUCTURE
 *   - Status page URL (status.{domain})
 *   - Chains mentioned on homepage
 *
 * Input:  data/protocol_domains.json or data/whiteclaws_protocol_index.json
 * Output: data/website_contacts.json
 *
 * Usage:
 *   node scripts/pull-website-contacts.cjs
 *   node scripts/pull-website-contacts.cjs --resume
 *   node scripts/pull-website-contacts.cjs --batch=50
 *   node scripts/pull-website-contacts.cjs --start=100
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "website_contacts.json");
const CHECKPOINT_FILE = path.join(DATA_DIR, ".website_checkpoint.json");
const TIMEOUT_MS = 10000;
const DELAY_MS = 1500;
const CHECKPOINT_INTERVAL = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function safeFetch(url, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "WhiteClaws-SecurityBot/1.0 (security research; contact: security@whiteclaws.xyz)",
        Accept: "text/html,text/plain,application/xhtml+xml,*/*",
      },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function getDomain(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function getBaseDomain(url) {
  const d = getDomain(url);
  // Remove www., app., v3-app. etc
  return d.replace(/^(www|app|v[0-9]+-?app|beta|portal|bridge|trade|swap)\./i, "");
}

function getOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Extractors
// ---------------------------------------------------------------------------

function extractEmails(text) {
  if (!text) return [];
  const pattern = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const all = [...new Set(text.match(pattern) || [])];
  return all.filter(
    (e) =>
      !e.includes("example.com") &&
      !e.includes("sentry.io") &&
      !e.includes("cloudflare") &&
      !e.includes(".png") &&
      !e.includes(".jpg") &&
      !e.includes(".svg") &&
      !e.includes(".woff") &&
      !e.endsWith(".js") &&
      !e.endsWith(".css") &&
      !e.endsWith(".map") &&
      e.length < 80
  );
}

function parseSecurityTxt(text) {
  if (!text || text.length > 50000) return null;
  if (!text.toLowerCase().includes("contact:")) return null;

  const contacts = {};
  const emails = [];

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes(":")) continue;

    const colonIdx = trimmed.indexOf(":");
    const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const val = trimmed.slice(colonIdx + 1).trim();

    if (key === "contact") {
      if (val.startsWith("mailto:")) emails.push(val.replace("mailto:", ""));
      else if (val.includes("@")) emails.push(val);
      else if (val.startsWith("http")) contacts.security_page_url = val;
    }
    if (key === "policy") contacts.security_policy_url = val;
    if (key === "encryption") contacts.pgp_key_url = val;
    if (key === "preferred-languages") contacts.preferred_languages = val;
    if (key === "hiring") contacts.hiring_url = val;
  }

  if (emails.length) {
    const sec = emails.find((e) => e.toLowerCase().includes("security"));
    contacts.security_email = sec || emails[0];
    if (emails.length > 1) contacts.all_security_emails = emails;
  }

  return Object.keys(contacts).length ? contacts : null;
}

function extractSocialLinks(html) {
  if (!html) return {};
  const c = {};

  // Twitter/X — href patterns
  const twPatterns = [
    /href=["'](?:https?:)?\/\/(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)\/?["']/gi,
  ];
  for (const p of twPatterns) {
    let m;
    while ((m = p.exec(html))) {
      const handle = m[1].toLowerCase();
      if (!["share", "intent", "search", "home", "i", "login", "signup"].includes(handle)) {
        c.twitter = `@${m[1]}`;
        break;
      }
    }
    if (c.twitter) break;
  }

  // Discord
  const dcMatch = html.match(
    /href=["'](https?:\/\/(?:discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9\-]+)["']/i
  );
  if (dcMatch) c.discord = dcMatch[1];

  // Telegram
  const tgMatch = html.match(
    /href=["'](https?:\/\/t\.me\/[a-zA-Z0-9_]+)["']/i
  );
  if (tgMatch) c.telegram = tgMatch[1];

  // GitHub org (not individual repos)
  const ghMatch = html.match(
    /href=["'](https?:\/\/github\.com\/[a-zA-Z0-9_\-]+)\/?["']/i
  );
  if (ghMatch) c.github = ghMatch[1];

  // Reddit
  const rdMatch = html.match(
    /href=["'](https?:\/\/(?:www\.)?reddit\.com\/r\/[a-zA-Z0-9_]+)\/?["']/i
  );
  if (rdMatch) c.reddit = rdMatch[1];

  // Medium / Blog
  const blogMatch = html.match(
    /href=["'](https?:\/\/(?:medium\.com\/[@a-zA-Z0-9\-]+|blog\.[a-zA-Z0-9.\-]+[a-zA-Z]))["']/i
  );
  if (blogMatch) c.blog = blogMatch[1];

  // Mailto links — categorize by type
  const mailtoAll = html.match(
    /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi
  );
  if (mailtoAll) {
    const emails = [...new Set(mailtoAll.map((m) => m.replace("mailto:", "")))];
    for (const e of emails) {
      const el = e.toLowerCase();
      if (el.includes("security") || el.includes("vuln") || el.includes("bug")) {
        c.security_email = e;
      } else if (el.includes("legal") || el.includes("compliance")) {
        c.legal_email = e;
      } else if (
        el.includes("contact") || el.includes("hello") ||
        el.includes("info") || el.includes("team") || el.includes("support")
      ) {
        c.contact_email = e;
      } else if (!c.contact_email) {
        c.contact_email = e;
      }
    }
  }

  return c;
}

function extractMetaTags(html) {
  if (!html) return {};
  const c = {};

  // twitter:site
  const twSite = html.match(
    /<meta[^>]+(?:name|property)=["']twitter:site["'][^>]+content=["']@?([a-zA-Z0-9_]+)["']/i
  );
  if (twSite) c.twitter = `@${twSite[1]}`;

  // Also try reverse order (content before name)
  if (!c.twitter) {
    const twSite2 = html.match(
      /<meta[^>]+content=["']@?([a-zA-Z0-9_]+)["'][^>]+(?:name|property)=["']twitter:site["']/i
    );
    if (twSite2) c.twitter = `@${twSite2[1]}`;
  }

  // og:site_name
  const ogSite = html.match(
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i
  );
  if (ogSite) c.og_site_name = ogSite[1];

  return c;
}

function extractDocsLinks(html, origin) {
  if (!html) return {};
  const c = {};
  const baseDomain = getBaseDomain(origin);

  // Look for docs links in HTML
  const docsPatterns = [
    // href to docs subdomain
    new RegExp(`href=["'](https?://docs\\.${baseDomain.replace(".", "\\.")}[^"']*)["']`, "i"),
    // href to /docs path
    /href=["'](\/docs\/?[^"']*)["']/i,
    // href with "documentation" text nearby
    /href=["']([^"']+)["'][^>]*>\s*(?:Documentation|Docs|Developer Docs|Dev Docs)/i,
  ];

  for (const p of docsPatterns) {
    const m = html.match(p);
    if (m) {
      let url = m[1];
      if (url.startsWith("/")) url = `${origin}${url}`;
      c.docs_url = url;
      break;
    }
  }

  // Developer / API docs
  const devPatterns = [
    /href=["']([^"']*(?:developer|api-doc|dev-doc)[^"']*)["']/i,
    /href=["']([^"']+)["'][^>]*>\s*(?:API|Developers|Dev Portal)/i,
  ];
  for (const p of devPatterns) {
    const m = html.match(p);
    if (m) {
      let url = m[1];
      if (url.startsWith("/")) url = `${origin}${url}`;
      c.developer_docs_url = url;
      break;
    }
  }

  // Whitepaper
  const wpPatterns = [
    /href=["']([^"']*whitepaper[^"']*)["']/i,
    /href=["']([^"']*litepaper[^"']*)["']/i,
    /href=["']([^"']+)["'][^>]*>\s*(?:Whitepaper|White Paper|Lite Paper|Litepaper)/i,
  ];
  for (const p of wpPatterns) {
    const m = html.match(p);
    if (m) {
      let url = m[1];
      if (url.startsWith("/")) url = `${origin}${url}`;
      c.whitepaper_url = url;
      break;
    }
  }

  return c;
}

function extractAuditInfo(html, origin) {
  if (!html) return {};
  const c = {};

  // Audit report links (PDFs, pages)
  const auditLinks = [];
  const auditPattern =
    /href=["']([^"']*(?:audit|security[_\-]review)[^"']*\.pdf)["']/gi;
  let m;
  while ((m = auditPattern.exec(html))) {
    let url = m[1];
    if (url.startsWith("/")) url = `${origin}${url}`;
    auditLinks.push(url);
  }

  // Also match audit page links (not just PDFs)
  const auditPagePattern =
    /href=["']([^"']*(?:\/audit|\/security-review|\/security-report)[^"']*)["']/gi;
  while ((m = auditPagePattern.exec(html))) {
    let url = m[1];
    if (url.startsWith("/")) url = `${origin}${url}`;
    if (!auditLinks.includes(url)) auditLinks.push(url);
  }

  if (auditLinks.length) c.audit_report_urls = [...new Set(auditLinks)].slice(0, 10);

  // Known auditor names mentioned in text
  const knownAuditors = [
    "OpenZeppelin", "Trail of Bits", "Consensys Diligence", "Certora",
    "Chainsecurity", "ChainSecurity", "Sigma Prime", "Peckshield", "PeckShield",
    "Quantstamp", "Halborn", "Cyfrin", "Spearbit", "Code4rena", "Sherlock",
    "Immunefi", "Hacken", "SlowMist", "Runtime Verification", "Zellic",
    "OtterSec", "Otter Sec", "Dedaub", "MixBytes", "Least Authority",
    "Kudelski", "NCC Group", "Nethermind", "Veridise", "Cantina",
  ];

  const foundAuditors = knownAuditors.filter((a) =>
    html.toLowerCase().includes(a.toLowerCase())
  );
  if (foundAuditors.length) c.auditors = foundAuditors;

  return c;
}

function extractBountyPolicyInfo(html, origin) {
  if (!html) return {};
  const c = {};

  // Bug bounty / security page links
  const bountyPatterns = [
    /href=["']([^"']*(?:bug[_\-]?bounty|responsible[_\-]?disclosure|security[_\-]?policy|vulnerability[_\-]?disclosure)[^"']*)["']/gi,
    /href=["']([^"']+)["'][^>]*>\s*(?:Bug Bounty|Report a Bug|Responsible Disclosure|Security Policy|Vulnerability)/i,
  ];

  for (const p of bountyPatterns) {
    const m = html.match(p);
    if (m) {
      let url = m[1];
      if (url.startsWith("/")) url = `${origin}${url}`;
      c.bounty_policy_url = url;
      break;
    }
  }

  return c;
}

function extractLegalEmail(html) {
  if (!html) return {};
  const c = {};
  const emails = extractEmails(html);
  for (const e of emails) {
    const el = e.toLowerCase();
    if (el.includes("legal") || el.includes("compliance") || el.includes("notice")) {
      c.legal_email = e;
      break;
    }
  }
  return c;
}

function extractChains(html) {
  if (!html) return {};

  const chainKeywords = {
    ethereum: "Ethereum",
    arbitrum: "Arbitrum",
    optimism: "Optimism",
    polygon: "Polygon",
    base: "Base",
    avalanche: "Avalanche",
    "bnb chain": "BNB Chain",
    bsc: "BNB Chain",
    solana: "Solana",
    fantom: "Fantom",
    gnosis: "Gnosis",
    zksync: "zkSync",
    linea: "Linea",
    scroll: "Scroll",
    starknet: "StarkNet",
    cosmos: "Cosmos",
    near: "NEAR",
    sui: "Sui",
    aptos: "Aptos",
    sei: "Sei",
    mantle: "Mantle",
    blast: "Blast",
    mode: "Mode",
    celo: "Celo",
    moonbeam: "Moonbeam",
  };

  const lower = html.toLowerCase();
  const found = [];
  for (const [keyword, name] of Object.entries(chainKeywords)) {
    // Require word boundary-ish context to avoid false positives
    const pattern = new RegExp(`(?:^|[\\s,;|/"'>])${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[\\s,;|/"'<]|$)`, "i");
    if (pattern.test(lower)) {
      found.push(name);
    }
  }

  return found.length ? { chains_mentioned: [...new Set(found)] } : {};
}

// ---------------------------------------------------------------------------
// Per-protocol scraper
// ---------------------------------------------------------------------------

async function scrapeProtocol(slug, websiteUrl) {
  const origin = getOrigin(websiteUrl);
  const baseDomain = getBaseDomain(websiteUrl);
  const result = { slug, website: websiteUrl, source: [] };

  // -------------------------------------------------------
  // 1. security.txt
  // -------------------------------------------------------
  const secTxt =
    (await safeFetch(`${origin}/.well-known/security.txt`, 8000)) ||
    (await safeFetch(`${origin}/security.txt`, 8000));

  if (secTxt) {
    const parsed = parseSecurityTxt(secTxt);
    if (parsed) {
      Object.assign(result, parsed);
      result.source.push("security.txt");
    }
  }

  await sleep(400);

  // -------------------------------------------------------
  // 2. Homepage — everything from one page
  // -------------------------------------------------------
  const homepage = await safeFetch(websiteUrl, TIMEOUT_MS);
  if (homepage) {
    const headMatch = homepage.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const headHtml = headMatch ? headMatch[1] : "";
    const footerMatch = homepage.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
    const footerHtml = footerMatch
      ? footerMatch[1]
      : homepage.slice(Math.floor(homepage.length * 0.7));

    // Social from footer (highest priority)
    const footerSocial = extractSocialLinks(footerHtml);
    for (const [k, v] of Object.entries(footerSocial)) {
      if (v && !result[k]) {
        result[k] = v;
        if (!result.source.includes("website_footer")) result.source.push("website_footer");
      }
    }

    // Social from full page (fill gaps)
    const fullSocial = extractSocialLinks(homepage);
    for (const [k, v] of Object.entries(fullSocial)) {
      if (v && !result[k]) {
        result[k] = v;
        if (!result.source.includes("website_body")) result.source.push("website_body");
      }
    }

    // Meta tags (twitter:site, og:)
    const meta = extractMetaTags(headHtml);
    for (const [k, v] of Object.entries(meta)) {
      if (v && !result[k]) {
        result[k] = v;
        if (!result.source.includes("meta_tags")) result.source.push("meta_tags");
      }
    }

    // Documentation links
    const docs = extractDocsLinks(homepage, origin);
    for (const [k, v] of Object.entries(docs)) {
      if (v && !result[k]) {
        result[k] = v;
        if (!result.source.includes("docs_links")) result.source.push("docs_links");
      }
    }

    // Audit info from homepage
    const audits = extractAuditInfo(homepage, origin);
    for (const [k, v] of Object.entries(audits)) {
      if (v && !result[k]) result[k] = v;
    }

    // Bounty policy links
    const bounty = extractBountyPolicyInfo(homepage, origin);
    for (const [k, v] of Object.entries(bounty)) {
      if (v && !result[k]) result[k] = v;
    }

    // Chains mentioned
    const chains = extractChains(homepage);
    if (chains.chains_mentioned) result.chains_mentioned = chains.chains_mentioned;
  }

  await sleep(400);

  // -------------------------------------------------------
  // 3. Docs subdomain probe
  // -------------------------------------------------------
  if (!result.docs_url) {
    const docsProbe = await safeFetch(`https://docs.${baseDomain}`, 6000);
    if (docsProbe) {
      result.docs_url = `https://docs.${baseDomain}`;
      result.source.push("docs_subdomain");
    }
  }

  await sleep(300);

  // -------------------------------------------------------
  // 4. Status page probe
  // -------------------------------------------------------
  const statusProbe = await safeFetch(`https://status.${baseDomain}`, 5000);
  if (statusProbe) {
    result.status_page_url = `https://status.${baseDomain}`;
    result.source.push("status_subdomain");
  }

  await sleep(300);

  // -------------------------------------------------------
  // 5. /security and /bug-bounty pages (security email + audits)
  // -------------------------------------------------------
  for (const secPath of ["/security", "/bug-bounty", "/responsible-disclosure", "/audits"]) {
    const secPage = await safeFetch(`${origin}${secPath}`, 8000);
    if (secPage && secPage.length > 500) {
      const src = `page:${secPath}`;

      // Security emails
      if (!result.security_email) {
        const secEmails = extractEmails(secPage);
        const secEmail = secEmails.find(
          (e) => e.toLowerCase().includes("security") || e.toLowerCase().includes("bug")
        );
        if (secEmail) {
          result.security_email = secEmail;
          result.source.push(src);
        }
      }

      // Audit info from security page
      const audits = extractAuditInfo(secPage, origin);
      if (audits.audit_report_urls && !result.audit_report_urls) {
        result.audit_report_urls = audits.audit_report_urls;
      }
      if (audits.auditors) {
        result.auditors = [...new Set([...(result.auditors || []), ...audits.auditors])];
      }

      // Bounty policy
      if (!result.bounty_policy_url) {
        result.bounty_policy_url = `${origin}${secPath}`;
        if (!result.source.includes(src)) result.source.push(src);
      }

      // Social from security page
      const social = extractSocialLinks(secPage);
      for (const [k, v] of Object.entries(social)) {
        if (v && !result[k]) result[k] = v;
      }
    }
    await sleep(300);
  }

  // -------------------------------------------------------
  // 6. /terms or /legal page — legal email
  // -------------------------------------------------------
  if (!result.legal_email) {
    for (const legalPath of ["/terms", "/legal", "/privacy"]) {
      const legalPage = await safeFetch(`${origin}${legalPath}`, 8000);
      if (legalPage && legalPage.length > 500) {
        const legal = extractLegalEmail(legalPage);
        if (legal.legal_email) {
          result.legal_email = legal.legal_email;
          result.source.push(`page:${legalPath}`);
          break;
        }
      }
      await sleep(300);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function loadProtocols() {
  const domainsPath = path.join(DATA_DIR, "protocol_domains.json");
  const indexPath = path.join(DATA_DIR, "whiteclaws_protocol_index.json");

  let raw;
  if (fs.existsSync(domainsPath)) {
    raw = JSON.parse(fs.readFileSync(domainsPath, "utf-8"));
  } else if (fs.existsSync(indexPath)) {
    raw = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  } else {
    console.error("ERROR: No protocol list found in data/");
    console.error("Need: data/protocol_domains.json or data/whiteclaws_protocol_index.json");
    process.exit(1);
  }

  if (Array.isArray(raw)) {
    return raw
      .map((p) => ({ slug: p.slug, website: p.url || p.website || "" }))
      .filter((p) => p.website);
  }
  return Object.entries(raw)
    .map(([slug, info]) => ({
      slug,
      website: typeof info === "string" ? info : info?.url || info?.website || "",
    }))
    .filter((p) => p.website);
}

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"));
  }
  return { results: {}, lastIndex: 0 };
}

function saveCheckpoint(results, lastIndex) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ results, lastIndex }));
}

function parseArgs() {
  const args = { resume: false, batch: null, start: null };
  for (const a of process.argv.slice(2)) {
    if (a === "--resume") args.resume = true;
    if (a.startsWith("--batch=")) args.batch = parseInt(a.split("=")[1]);
    if (a.startsWith("--start=")) args.start = parseInt(a.split("=")[1]);
  }
  return args;
}

async function main() {
  const args = parseArgs();

  console.log("🦞 WhiteClaws Website Protocol Intelligence Scraper");
  console.log("=".repeat(60));

  const protocols = loadProtocols();

  // Dedupe by base domain
  const seenDomains = new Map();
  const deduped = [];
  const dupeMap = {};

  for (const p of protocols) {
    const domain = getBaseDomain(p.website);
    if (!domain) continue;
    if (seenDomains.has(domain)) {
      dupeMap[p.slug] = seenDomains.get(domain);
    } else {
      seenDomains.set(domain, p.slug);
      deduped.push(p);
    }
  }

  console.log(`Total protocols:  ${protocols.length}`);
  console.log(`Unique domains:   ${deduped.length}`);
  console.log(`Duplicate domains: ${Object.keys(dupeMap).length}`);

  let results = {};
  let startIdx = args.start || 0;

  if (args.resume) {
    const cp = loadCheckpoint();
    results = cp.results || {};
    startIdx = cp.lastIndex || 0;
    console.log(`Resuming from checkpoint: ${startIdx}/${deduped.length}`);
  }

  let endIdx = deduped.length;
  if (args.batch) endIdx = Math.min(startIdx + args.batch, deduped.length);

  // ~10 fetches per protocol × 1.5s delay = ~15s per protocol
  const estMinutes = Math.ceil(((endIdx - startIdx) * 15) / 60);
  console.log(`Processing: ${startIdx} → ${endIdx} (${endIdx - startIdx} protocols)`);
  console.log(`Est. time:  ~${estMinutes} minutes`);
  console.log(`\nPer protocol: security.txt → homepage → docs probe → status probe → /security → /legal`);
  console.log("=".repeat(60));
  console.log();

  let hits = 0;
  let errors = 0;

  for (let i = startIdx; i < endIdx; i++) {
    const { slug, website } = deduped[i];

    if (results[slug]) {
      console.log(`[${i + 1}/${endIdx}] ⏭  ${slug.padEnd(30)} (cached)`);
      continue;
    }

    try {
      const data = await scrapeProtocol(slug, website);
      results[slug] = data;

      const hasContact =
        data.security_email || data.contact_email || data.twitter ||
        data.discord || data.telegram;
      const hasDocs = data.docs_url || data.whitepaper_url;
      const hasAudits = data.audit_report_urls || data.auditors;

      if (hasContact || hasDocs || hasAudits) {
        hits++;
        const parts = [];
        if (data.security_email) parts.push(`sec:${data.security_email}`);
        if (data.contact_email) parts.push(`email:✓`);
        if (data.twitter) parts.push(`tw:${data.twitter}`);
        if (data.discord) parts.push("dc:✓");
        if (data.telegram) parts.push("tg:✓");
        if (data.docs_url) parts.push("docs:✓");
        if (data.auditors) parts.push(`audit:${data.auditors.length}`);
        console.log(
          `[${i + 1}/${endIdx}] ✅ ${slug.padEnd(30)} ${parts.join(" | ")}`
        );
      } else {
        console.log(`[${i + 1}/${endIdx}] ⬜ ${slug.padEnd(30)} (nothing found)`);
      }
    } catch (err) {
      errors++;
      console.log(`[${i + 1}/${endIdx}] ❌ ${slug.padEnd(30)} ${err.message}`);
    }

    if (i % CHECKPOINT_INTERVAL === 0 && i > startIdx) {
      saveCheckpoint(results, i);
    }
  }

  // Copy results for duplicate domains
  for (const [dupeSlug, canonSlug] of Object.entries(dupeMap)) {
    if (results[canonSlug]) {
      results[dupeSlug] = { ...results[canonSlug], slug: dupeSlug };
    }
  }

  // Save
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE);

  // Summary
  const vals = Object.values(results);
  console.log("\n" + "=".repeat(60));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(60));
  console.log(`Protocols scraped:   ${vals.length}`);
  console.log();
  console.log("--- CONTACTS ---");
  console.log(`Security email:      ${vals.filter((v) => v.security_email).length}`);
  console.log(`Contact email:       ${vals.filter((v) => v.contact_email).length}`);
  console.log(`Legal email:         ${vals.filter((v) => v.legal_email).length}`);
  console.log(`security.txt found:  ${vals.filter((v) => v.source?.includes("security.txt")).length}`);
  console.log();
  console.log("--- SOCIAL ---");
  console.log(`Twitter:             ${vals.filter((v) => v.twitter).length}`);
  console.log(`Discord:             ${vals.filter((v) => v.discord).length}`);
  console.log(`Telegram:            ${vals.filter((v) => v.telegram).length}`);
  console.log(`GitHub:              ${vals.filter((v) => v.github).length}`);
  console.log(`Reddit:              ${vals.filter((v) => v.reddit).length}`);
  console.log();
  console.log("--- HUNTER TOOLKIT ---");
  console.log(`Docs URL:            ${vals.filter((v) => v.docs_url).length}`);
  console.log(`Developer docs:      ${vals.filter((v) => v.developer_docs_url).length}`);
  console.log(`Whitepaper:          ${vals.filter((v) => v.whitepaper_url).length}`);
  console.log(`Audit reports:       ${vals.filter((v) => v.audit_report_urls).length}`);
  console.log(`Auditor names:       ${vals.filter((v) => v.auditors).length}`);
  console.log(`Bounty policy URL:   ${vals.filter((v) => v.bounty_policy_url).length}`);
  console.log(`Status page:         ${vals.filter((v) => v.status_page_url).length}`);
  console.log(`Chains mentioned:    ${vals.filter((v) => v.chains_mentioned).length}`);
  console.log(`\nErrors: ${errors}`);
  console.log(`Saved to: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
