#!/usr/bin/env node

/**
 * Website Security Contact Scraper
 * ==================================
 * Scrapes protocol websites for security contacts, social links, and emails.
 * This is the LAST MILE — fills gaps that GitHub API and CoinGecko missed.
 *
 * For each protocol domain, checks (in order):
 *   1. /.well-known/security.txt  — structured security contact (RFC 9116)
 *   2. /security.txt              — fallback location
 *   3. Homepage HTML              — footer social links, mailto:, meta tags
 *   4. /security or /bug-bounty   — dedicated security page with email
 *
 * Input:  data/protocol_domains.json (slug -> { url })
 *         OR data/whiteclaws_protocol_index.json
 *
 * Output: data/website_contacts.json
 *
 * Usage:
 *   node scripts/pull-website-contacts.cjs
 *   node scripts/pull-website-contacts.cjs --resume     # resume from checkpoint
 *   node scripts/pull-website-contacts.cjs --batch=50   # first 50 only
 *   node scripts/pull-website-contacts.cjs --start=100  # start from index 100
 *
 * Resume-safe: checkpoints every 10 protocols to data/.website_checkpoint.json
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "website_contacts.json");
const CHECKPOINT_FILE = path.join(DATA_DIR, ".website_checkpoint.json");
const TIMEOUT_MS = 10000;
const DELAY_MS = 1500; // 1.5s between fetches — polite crawling
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
    const text = await res.text();
    return text;
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
  // Filter out common false positives
  return all.filter(
    (e) =>
      !e.includes("example.com") &&
      !e.includes("sentry.io") &&
      !e.includes("cloudflare") &&
      !e.includes(".png") &&
      !e.includes(".jpg") &&
      !e.includes(".svg") &&
      !e.endsWith(".js") &&
      !e.endsWith(".css") &&
      e.length < 80
  );
}

function parseSecurityTxt(text) {
  if (!text || text.length > 50000) return null;
  // Must contain at least "Contact:" to be a valid security.txt
  if (!text.toLowerCase().includes("contact:")) return null;

  const contacts = {};
  const emails = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes(":")) continue;

    const colonIdx = trimmed.indexOf(":");
    const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const val = trimmed.slice(colonIdx + 1).trim();

    if (key === "contact") {
      if (val.startsWith("mailto:")) {
        emails.push(val.replace("mailto:", ""));
      } else if (val.includes("@")) {
        emails.push(val);
      } else if (val.startsWith("http")) {
        contacts.security_page = val;
      }
    }
    if (key === "preferred-languages") {
      contacts.preferred_languages = val;
    }
    if (key === "policy") {
      contacts.security_policy = val;
    }
    if (key === "encryption") {
      contacts.pgp_key = val;
    }
  }

  if (emails.length) {
    const sec = emails.find((e) => e.toLowerCase().includes("security"));
    contacts.security_email = sec || emails[0];
    if (emails.length > 1) contacts.all_emails = emails;
  }

  return Object.keys(contacts).length ? contacts : null;
}

function extractSocialLinks(html) {
  if (!html) return {};
  const contacts = {};

  // Twitter/X
  const twPatterns = [
    /href=["'](?:https?:)?\/\/(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)["']/gi,
    /(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/gi,
  ];
  for (const p of twPatterns) {
    const m = p.exec(html);
    if (m && m[1] && !["share", "intent", "search", "home", "i"].includes(m[1].toLowerCase())) {
      contacts.twitter = `@${m[1]}`;
      break;
    }
  }

  // Discord
  const dcMatch = html.match(
    /href=["'](https?:\/\/(?:discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9\-]+)["']/i
  );
  if (dcMatch) contacts.discord = dcMatch[1];

  // Telegram
  const tgMatch = html.match(
    /href=["'](https?:\/\/t\.me\/[a-zA-Z0-9_]+)["']/i
  );
  if (tgMatch) contacts.telegram = tgMatch[1];

  // GitHub org
  const ghMatch = html.match(
    /href=["'](https?:\/\/github\.com\/[a-zA-Z0-9_\-]+)\/?["']/i
  );
  if (ghMatch) contacts.github = ghMatch[1];

  // Mailto links
  const mailtoMatches = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi);
  if (mailtoMatches) {
    const emails = mailtoMatches.map((m) => m.replace("mailto:", ""));
    const sec = emails.find((e) => e.toLowerCase().includes("security"));
    const contact = emails.find(
      (e) =>
        e.toLowerCase().includes("contact") ||
        e.toLowerCase().includes("hello") ||
        e.toLowerCase().includes("info") ||
        e.toLowerCase().includes("team")
    );
    if (sec) contacts.security_email = sec;
    if (contact) contacts.contact_email = contact;
    if (!sec && !contact && emails.length) contacts.contact_email = emails[0];
  }

  // Medium / Blog
  const mediumMatch = html.match(
    /href=["'](https?:\/\/(?:medium\.com|blog\.[a-z]+\.[a-z]+)\/[^"']+)["']/i
  );
  if (mediumMatch) contacts.blog = mediumMatch[1];

  return contacts;
}

function extractMetaTags(html) {
  if (!html) return {};
  const contacts = {};

  // og:site_name, og:title for verification
  const ogSite = html.match(
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i
  );
  if (ogSite) contacts.og_site_name = ogSite[1];

  // twitter:site meta tag
  const twSite = html.match(
    /<meta[^>]+(?:name|property)=["']twitter:site["'][^>]+content=["']@?([a-zA-Z0-9_]+)["']/i
  );
  if (twSite && !contacts.twitter) contacts.twitter = `@${twSite[1]}`;

  // twitter:creator
  const twCreator = html.match(
    /<meta[^>]+(?:name|property)=["']twitter:creator["'][^>]+content=["']@?([a-zA-Z0-9_]+)["']/i
  );
  if (twCreator) contacts.twitter_creator = `@${twCreator[1]}`;

  return contacts;
}

function extractSecurityPageEmails(html) {
  if (!html) return {};
  const contacts = {};
  const emails = extractEmails(html);
  if (emails.length) {
    const sec = emails.find((e) => e.toLowerCase().includes("security"));
    const bug = emails.find(
      (e) =>
        e.toLowerCase().includes("bug") || e.toLowerCase().includes("vuln")
    );
    if (sec) contacts.security_email = sec;
    else if (bug) contacts.security_email = bug;
    else contacts.security_page_email = emails[0];
  }
  return contacts;
}

// ---------------------------------------------------------------------------
// Per-protocol scraper
// ---------------------------------------------------------------------------

async function scrapeProtocol(slug, websiteUrl) {
  const origin = getOrigin(websiteUrl);
  const contacts = { slug, website: websiteUrl, source: [] };

  // 1. security.txt (RFC 9116 location)
  const secTxt =
    (await safeFetch(`${origin}/.well-known/security.txt`, 8000)) ||
    (await safeFetch(`${origin}/security.txt`, 8000));

  if (secTxt) {
    const parsed = parseSecurityTxt(secTxt);
    if (parsed) {
      Object.assign(contacts, parsed);
      contacts.source.push("security.txt");
    }
  }

  await sleep(500);

  // 2. Homepage — footer links, meta tags, mailto
  const homepage = await safeFetch(websiteUrl, TIMEOUT_MS);
  if (homepage) {
    // Only parse last 30% of HTML (footer area) + head (meta tags)
    const headMatch = homepage.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const headHtml = headMatch ? headMatch[1] : "";

    // Footer: last 30% of body or look for <footer> tag
    const footerMatch = homepage.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
    const footerHtml = footerMatch
      ? footerMatch[1]
      : homepage.slice(Math.floor(homepage.length * 0.7));

    const socialFromFooter = extractSocialLinks(footerHtml);
    const socialFromFull = extractSocialLinks(homepage); // fallback scan full page
    const metaContacts = extractMetaTags(headHtml);

    // Merge: prefer footer findings, fill from full page, then meta
    for (const [k, v] of Object.entries(socialFromFooter)) {
      if (v && !contacts[k]) {
        contacts[k] = v;
        if (!contacts.source.includes("website_footer"))
          contacts.source.push("website_footer");
      }
    }
    for (const [k, v] of Object.entries(socialFromFull)) {
      if (v && !contacts[k]) {
        contacts[k] = v;
        if (!contacts.source.includes("website_body"))
          contacts.source.push("website_body");
      }
    }
    for (const [k, v] of Object.entries(metaContacts)) {
      if (v && !contacts[k]) {
        contacts[k] = v;
        if (!contacts.source.includes("meta_tags"))
          contacts.source.push("meta_tags");
      }
    }
  }

  await sleep(500);

  // 3. /security or /bug-bounty page (only if we don't have security_email yet)
  if (!contacts.security_email) {
    for (const secPath of ["/security", "/bug-bounty", "/responsible-disclosure"]) {
      const secPage = await safeFetch(`${origin}${secPath}`, 8000);
      if (secPage && secPage.length > 500) {
        const secContacts = extractSecurityPageEmails(secPage);
        const secSocial = extractSocialLinks(secPage);
        for (const [k, v] of Object.entries({ ...secContacts, ...secSocial })) {
          if (v && !contacts[k]) {
            contacts[k] = v;
            if (!contacts.source.includes(`page:${secPath}`))
              contacts.source.push(`page:${secPath}`);
          }
        }
        if (secContacts.security_email) break; // Found what we need
      }
      await sleep(300);
    }
  }

  return contacts;
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

  // Normalize to array of { slug, website }
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
  fs.writeFileSync(
    CHECKPOINT_FILE,
    JSON.stringify({ results, lastIndex }, null, 2)
  );
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

  console.log("🌐 Website Security Contact Scraper");
  console.log("=".repeat(60));

  // Dedupe by domain (avoid hitting same site twice for different slugs)
  const protocols = loadProtocols();
  const seenDomains = new Map(); // domain -> first slug
  const deduped = [];
  const dupeMap = {}; // slug -> canonical slug (for copying results)

  for (const p of protocols) {
    const domain = getDomain(p.website);
    if (!domain) continue;
    if (seenDomains.has(domain)) {
      dupeMap[p.slug] = seenDomains.get(domain);
    } else {
      seenDomains.set(domain, p.slug);
      deduped.push(p);
    }
  }

  console.log(`Total protocols: ${protocols.length}`);
  console.log(`Unique domains:  ${deduped.length}`);
  console.log(`Duplicates:      ${Object.keys(dupeMap).length}`);

  // Handle resume / batch / start
  let results = {};
  let startIdx = args.start || 0;

  if (args.resume) {
    const cp = loadCheckpoint();
    results = cp.results || {};
    startIdx = cp.lastIndex || 0;
    console.log(`Resuming from checkpoint: ${startIdx}/${deduped.length}`);
  }

  let endIdx = deduped.length;
  if (args.batch) {
    endIdx = Math.min(startIdx + args.batch, deduped.length);
  }

  const estMinutes = Math.ceil(((endIdx - startIdx) * 4 * DELAY_MS) / 60000);
  console.log(`Processing: ${startIdx} to ${endIdx} (${endIdx - startIdx} protocols)`);
  console.log(`Est. time:  ~${estMinutes} minutes`);
  console.log("=".repeat(60));
  console.log();

  let hits = 0;
  let empty = 0;
  let errors = 0;

  for (let i = startIdx; i < endIdx; i++) {
    const { slug, website } = deduped[i];

    // Skip if already done
    if (results[slug]) {
      console.log(`[${i + 1}/${endIdx}] ⏭  ${slug.padEnd(30)} (cached)`);
      continue;
    }

    try {
      const contacts = await scrapeProtocol(slug, website);

      const hasData =
        contacts.security_email ||
        contacts.contact_email ||
        contacts.twitter ||
        contacts.discord ||
        contacts.telegram;

      results[slug] = contacts;

      if (hasData) {
        hits++;
        const parts = [];
        if (contacts.security_email) parts.push(`sec:${contacts.security_email}`);
        if (contacts.contact_email) parts.push(`email:${contacts.contact_email}`);
        if (contacts.twitter) parts.push(`tw:${contacts.twitter}`);
        if (contacts.discord) parts.push("dc:✓");
        if (contacts.telegram) parts.push("tg:✓");
        console.log(
          `[${i + 1}/${endIdx}] ✅ ${slug.padEnd(30)} ${parts.join(" | ")} [${contacts.source.join(",")}]`
        );
      } else {
        empty++;
        console.log(`[${i + 1}/${endIdx}] ⬜ ${slug.padEnd(30)} (nothing found)`);
      }
    } catch (err) {
      errors++;
      console.log(`[${i + 1}/${endIdx}] ❌ ${slug.padEnd(30)} ${err.message}`);
    }

    // Checkpoint
    if (i % CHECKPOINT_INTERVAL === 0 && i > startIdx) {
      saveCheckpoint(results, i);
    }

    await sleep(DELAY_MS);
  }

  // Copy results for duplicate domains
  for (const [dupeSlug, canonSlug] of Object.entries(dupeMap)) {
    if (results[canonSlug]) {
      results[dupeSlug] = { ...results[canonSlug], slug: dupeSlug };
    }
  }

  // Save final output
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

  // Clean checkpoint
  if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE);

  // Summary
  const vals = Object.values(results);
  console.log("\n" + "=".repeat(60));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(60));
  console.log(`Protocols scraped:  ${vals.length}`);
  console.log(`Security email:     ${vals.filter((v) => v.security_email).length}`);
  console.log(`Contact email:      ${vals.filter((v) => v.contact_email).length}`);
  console.log(`Twitter:            ${vals.filter((v) => v.twitter).length}`);
  console.log(`Discord:            ${vals.filter((v) => v.discord).length}`);
  console.log(`Telegram:           ${vals.filter((v) => v.telegram).length}`);
  console.log(`GitHub:             ${vals.filter((v) => v.github).length}`);
  console.log(`security.txt found: ${vals.filter((v) => v.source?.includes("security.txt")).length}`);
  console.log(`Errors:             ${errors}`);
  console.log(`\nSaved to: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
