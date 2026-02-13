#!/usr/bin/env node

/**
 * CoinGecko Protocol Enrichment Script
 * =====================================
 * Pulls social links (Twitter, Telegram, Discord, Reddit, GitHub repos)
 * for all WhiteClaws protocols via the CoinGecko API.
 *
 * Strategy:
 *   1. Fetch DefiLlama /protocols (has gecko_id mapped for ~2200 protocols)
 *   2. Match our protocols to gecko_ids via DefiLlama slug bridge
 *   3. Fetch CoinGecko /coins/{id} for each matched protocol
 *   4. Extract: twitter, telegram, discord, subreddit, repos, homepage
 *   5. Save to data/coingecko_contacts.json
 *
 * Rate Limits (CoinGecko free tier):
 *   - 10-30 calls/min (varies by load)
 *   - Script uses 2.5s delay between calls (~24/min, safe margin)
 *   - With Pro API key: set COINGECKO_API_KEY env var for 500 calls/min
 *
 * Usage:
 *   node scripts/pull-coingecko-contacts.cjs
 *   COINGECKO_API_KEY=CG-xxxxx node scripts/pull-coingecko-contacts.cjs
 *
 * Output: data/coingecko_contacts.json
 */

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.COINGECKO_API_KEY || null;
const BASE_URL = API_KEY
  ? "https://pro-api.coingecko.com/api/v3"
  : "https://api.coingecko.com/api/v3";
const DELAY_MS = API_KEY ? 500 : 2500; // Pro: 500ms, Free: 2.5s
const DATA_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "coingecko_contacts.json");
const CHECKPOINT_FILE = path.join(DATA_DIR, ".coingecko_checkpoint.json");

// Our protocol list — slug to website mapping
// Loaded from data/protocol_domains.json if it exists, otherwise from whiteclaws_protocol_index.json
function loadOurProtocols() {
  const domainsPath = path.join(DATA_DIR, "protocol_domains.json");
  const indexPath = path.join(DATA_DIR, "whiteclaws_protocol_index.json");

  if (fs.existsSync(domainsPath)) {
    const raw = JSON.parse(fs.readFileSync(domainsPath, "utf-8"));
    // protocol_domains.json format: { slug: { url, ... } }
    return Object.entries(raw).map(([slug, info]) => ({
      slug,
      website: typeof info === "object" ? info.url || info.website || "" : info,
    }));
  }
  if (fs.existsSync(indexPath)) {
    const raw = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    if (Array.isArray(raw))
      return raw.map((p) => ({ slug: p.slug, website: p.website || "" }));
    return Object.entries(raw).map(([slug, info]) => ({
      slug,
      website: typeof info === "string" ? info : info?.website || "",
    }));
  }
  console.error(
    "ERROR: No protocol list found. Need data/protocol_domains.json or data/whiteclaws_protocol_index.json"
  );
  process.exit(1);
}

async function fetchJSON(url) {
  const headers = { Accept: "application/json" };
  if (API_KEY) headers["x-cg-pro-api-key"] = API_KEY;

  const res = await fetch(url, { headers });
  if (res.status === 429) {
    console.log("    ⚠️  Rate limited. Waiting 60s...");
    await sleep(60000);
    return fetchJSON(url); // Retry
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getDomain(url) {
  try {
    return new URL(url).hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/^app\./, "");
  } catch {
    return "";
  }
}

function extractContacts(coin) {
  const links = coin.links || {};
  const contacts = {};

  // Twitter
  if (links.twitter_screen_name) {
    contacts.twitter = `@${links.twitter_screen_name}`;
  }

  // Telegram
  if (links.telegram_channel_identifier) {
    contacts.telegram = `https://t.me/${links.telegram_channel_identifier}`;
    contacts.telegram_handle = links.telegram_channel_identifier;
  }

  // Discord (in chat_url array)
  if (Array.isArray(links.chat_url)) {
    const discord = links.chat_url.find(
      (u) => u && u.includes("discord")
    );
    if (discord) contacts.discord = discord;
    // Also grab non-discord chat links
    const others = links.chat_url.filter(
      (u) => u && !u.includes("discord")
    );
    if (others.length) contacts.other_chat = others;
  }

  // Reddit
  if (links.subreddit_url) {
    contacts.subreddit = links.subreddit_url;
  }

  // Homepage
  if (Array.isArray(links.homepage)) {
    const hp = links.homepage.filter((u) => u);
    if (hp.length) contacts.homepage = hp[0];
  }

  // GitHub repos
  if (links.repos_url?.github) {
    const repos = links.repos_url.github.filter((u) => u);
    if (repos.length) contacts.github_repos = repos;
  }

  // Official forum / announcement
  if (Array.isArray(links.official_forum_url)) {
    const forums = links.official_forum_url.filter((u) => u);
    if (forums.length) contacts.forum = forums;
  }

  // Community data
  const cd = coin.community_data || {};
  if (cd.telegram_channel_user_count) {
    contacts.telegram_members = cd.telegram_channel_user_count;
  }

  // Metadata
  contacts.coingecko_id = coin.id;
  contacts.coingecko_name = coin.name;
  contacts.symbol = coin.symbol;
  if (coin.market_cap_rank) contacts.market_cap_rank = coin.market_cap_rank;

  return contacts;
}

// Checkpoint management for resuming interrupted runs
function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"));
  }
  return { completed: {}, lastIndex: 0 };
}

function saveCheckpoint(checkpoint) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

async function main() {
  console.log("🦎 CoinGecko Protocol Enrichment");
  console.log("=".repeat(60));
  console.log(`Mode: ${API_KEY ? "PRO (500 req/min)" : "FREE (24 req/min)"}`);
  console.log(`Delay: ${DELAY_MS}ms between calls`);
  console.log();

  // 1. Load our protocols
  const ourProtocols = loadOurProtocols();
  console.log(`Our protocols: ${ourProtocols.length}`);

  // 2. Fetch DefiLlama for gecko_id mapping
  console.log("Fetching DefiLlama protocol list...");
  const llamaData = await fetchJSON("https://api.llama.fi/protocols");
  console.log(`DefiLlama protocols: ${llamaData.length}`);

  // Build DefiLlama indexes: by domain, by slug, by name
  const llamaByDomain = {};
  const llamaBySlug = {};
  const llamaByName = {};
  for (const p of llamaData) {
    const d = getDomain(p.url || "");
    if (d) llamaByDomain[d] = p;
    if (p.slug) llamaBySlug[p.slug.toLowerCase()] = p;
    if (p.name) llamaByName[p.name.toLowerCase()] = p;
  }

  // 3. Match our protocols to gecko_ids
  const toFetch = []; // { slug, geckoId }
  let noGeckoId = 0;
  let noMatch = 0;

  for (const proto of ourProtocols) {
    const domain = getDomain(proto.website);
    const slug = proto.slug.toLowerCase();

    // Try domain, then slug, then name matching
    const match =
      llamaByDomain[domain] ||
      llamaBySlug[slug] ||
      llamaBySlug[slug.replace(/-/g, "")] ||
      llamaByName[slug] ||
      llamaByName[slug.replace(/-/g, " ")];

    if (match?.gecko_id) {
      toFetch.push({ slug: proto.slug, geckoId: match.gecko_id });
    } else if (match) {
      noGeckoId++;
    } else {
      noMatch++;
    }
  }

  console.log(`\nMatched with gecko_id: ${toFetch.length}`);
  console.log(`Matched but no gecko_id: ${noGeckoId}`);
  console.log(`No DefiLlama match: ${noMatch}`);
  console.log(
    `Estimated time: ${Math.ceil((toFetch.length * DELAY_MS) / 60000)} minutes`
  );
  console.log();

  // 4. Load checkpoint for resume support
  const checkpoint = loadCheckpoint();
  const results = checkpoint.completed || {};
  let startIdx = 0;

  // Find where to resume from
  if (Object.keys(results).length > 0) {
    startIdx = Object.keys(results).length;
    console.log(`Resuming from checkpoint: ${startIdx}/${toFetch.length} done`);
  }

  // 5. Fetch each protocol from CoinGecko
  let hits = Object.keys(results).length;
  let errors = 0;

  for (let i = startIdx; i < toFetch.length; i++) {
    const { slug, geckoId } = toFetch[i];

    // Skip if already done (e.g. from checkpoint)
    if (results[slug]) continue;

    try {
      const url = `${BASE_URL}/coins/${geckoId}?localization=false&tickers=false&market_data=false&community_data=true&developer_data=false&sparkline=false`;
      const coin = await fetchJSON(url);
      const contacts = extractContacts(coin);

      if (
        contacts.twitter ||
        contacts.telegram ||
        contacts.discord ||
        contacts.github_repos
      ) {
        results[slug] = { slug, ...contacts, source: "coingecko" };
        hits++;
        const parts = [];
        if (contacts.twitter) parts.push(`tw:${contacts.twitter}`);
        if (contacts.telegram) parts.push(`tg:${contacts.telegram_handle}`);
        if (contacts.discord) parts.push("discord:✓");
        console.log(
          `[${i + 1}/${toFetch.length}] ✅ ${slug.padEnd(30)} ${parts.join(" | ")}`
        );
      } else {
        results[slug] = { slug, coingecko_id: geckoId, source: "coingecko" };
        console.log(
          `[${i + 1}/${toFetch.length}] ⬜ ${slug.padEnd(30)} (no social links)`
        );
      }
    } catch (err) {
      errors++;
      console.log(
        `[${i + 1}/${toFetch.length}] ❌ ${slug.padEnd(30)} ${err.message}`
      );
    }

    // Save checkpoint every 25 protocols
    if (i % 25 === 0) {
      checkpoint.completed = results;
      checkpoint.lastIndex = i;
      saveCheckpoint(checkpoint);
    }

    await sleep(DELAY_MS);
  }

  // 6. Save final output
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

  // Clean up checkpoint
  if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE);

  // 7. Summary
  const vals = Object.values(results);
  console.log("\n" + "=".repeat(60));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total fetched:    ${vals.length}`);
  console.log(
    `Twitter:          ${vals.filter((v) => v.twitter).length}`
  );
  console.log(
    `Telegram:         ${vals.filter((v) => v.telegram).length}`
  );
  console.log(
    `Discord:          ${vals.filter((v) => v.discord).length}`
  );
  console.log(
    `Reddit:           ${vals.filter((v) => v.subreddit).length}`
  );
  console.log(
    `GitHub repos:     ${vals.filter((v) => v.github_repos).length}`
  );
  console.log(`Errors:           ${errors}`);
  console.log(`\nSaved to: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
