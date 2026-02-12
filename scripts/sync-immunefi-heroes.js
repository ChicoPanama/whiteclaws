#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const SOURCE_URL = 'https://immunefi.com/hacker-pledging/';
const OUT_JSON = path.join(process.cwd(), 'public/data/immunefi-heroes.json');
const OUT_SCHEMA = path.join(process.cwd(), 'public/data/immunefi-heroes.schema.json');
const EXPECTED_COUNT = 141;

function curl(url) {
  return execFileSync('curl', ['-4', '-sL', url], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 });
}

function parseHumanNumber(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[,$\s]/g, '').toUpperCase();
  const match = cleaned.match(/^([0-9]*\.?[0-9]+)([KMB])?$/);
  if (!match) return null;
  const value = Number(match[1]);
  const suffix = match[2];
  const mult = suffix === 'B' ? 1e9 : suffix === 'M' ? 1e6 : suffix === 'K' ? 1e3 : 1;
  return Math.round(value * mult);
}

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSrs(html) {
  const m = html.match(/\\"srs\\":(\[.*?\]),\\"currentSort\\"/s);
  if (!m) return [];
  try {
    const normalized = m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    return JSON.parse(normalized);
  } catch {
    return [];
  }
}


function extractMeta(html) {
  const stats = {};
  const re = /text-muted-foreground">([^<]{1,40})<\/span><\/div><div class="mt-3 flex items-baseline gap-2"><span class="font-bold text-2xl sm:text-3xl[^"]*">([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    stats[m[1].trim().toLowerCase()] = m[2].trim();
  }

  const pledgedRaw = stats['pledged hackers'];
  const totalRaw = stats['total pledged'];
  const activeRaw = stats['active pledgers'];

  return {
    pledged_hackers_count: pledgedRaw ? Number(pledgedRaw.replace(/,/g, '')) : null,
    total_pledged_imu_raw: totalRaw || null,
    total_pledged_imu: parseHumanNumber(totalRaw),
    active_pledgers: activeRaw ? Number(activeRaw.replace(/,/g, '')) : null,
  };
}


function extractTotalPages(html) {
  const pages = [...html.matchAll(/[?&]page=(\d+)/g)].map((m) => Number(m[1]));
  return Math.max(1, ...pages);
}

function extractMentions(text) {
  return [...new Set((text.match(/(^|\s)@([A-Za-z0-9_]{1,15})\b/g) || []).map((m) => m.trim().split('@').pop()))];
}

function extractDomains(text) {
  return [...new Set((text.match(/\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[\w\-./?%&=+#]*)?/g) || []).map((s) => s.replace(/[),.;]+$/, '')))];
}

function normalizeUrl(url) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function extractXHandleFromUrl(url) {
  if (!url) return null;
  const m = url.match(/https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})(?:\b|\/)/i);
  if (!m) return null;
  const blocked = new Set(['home', 'explore', 'i', 'intent', 'share', 'search', 'hashtag']);
  if (blocked.has(m[1].toLowerCase())) return null;
  return m[1];
}

function collectSearchXCandidates(searchHtml) {
  const candidates = [];
  let decoded = searchHtml;
  try {
    decoded = decodeURIComponent(searchHtml.replace(/\+/g, '%20'));
  } catch {
    decoded = searchHtml;
  }
  for (const source of [searchHtml, decoded]) {
    for (const m of source.matchAll(/https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[A-Za-z0-9_\/?:=&.%#-]+/gi)) {
      const handle = extractXHandleFromUrl(m[0]);
      if (handle) candidates.push(handle);
    }
  }
  return [...new Set(candidates)];
}

function extractProfilePfpUrl(html, directoryPfpUrl) {
  if (directoryPfpUrl) return directoryPfpUrl;

  const avatarNextImage = [...html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/gi)]
    .map((m) => m[1])
    .find((src) => /profile%252Favatar|profile%2Favatar|profile\/avatar/i.test(src));

  if (avatarNextImage) {
    const m = avatarNextImage.match(/[?&]url=([^&]+)/i);
    if (m) {
      try {
        const decoded = decodeURIComponent(m[1]);
        if (/^https?:\/\//i.test(decoded)) return decoded;
        if (decoded.startsWith('/')) return `https://immunefi.com${decoded}`;
      } catch {
        // ignore
      }
    }
  }

  return 'https://immunefi.com/images/join-immunefi-pfp.png';
}

function extractProfile(hero, warnings) {
  const { handle, pfp_url_directory } = hero;
  const profile_url = `https://immunefi.com/profile/${handle}/`;
  const html = curl(profile_url);

  const member_since = decodeHtml((html.match(/Member since\s*<!-- -->\s*([^<]+)/i) || [])[1] || '') || null;

  const rankMatch = html.match(/(?:rank|ranking)<\/span>[^#]{0,80}#?([0-9,]+)/i);
  const all_time_rank = rankMatch ? Number(rankMatch[1].replace(/,/g, '')) : null;

  let total_earnings_usd_profile = null;
  const earningsIndex = html.indexOf('Total earnings');
  if (earningsIndex !== -1) {
    const earningsChunk = html.slice(earningsIndex, earningsIndex + 500);
    const earningMatch = earningsChunk.match(/\$([0-9][0-9,]*(?:\.[0-9]+)?[KMB]?)/i);
    if (earningMatch) total_earnings_usd_profile = parseHumanNumber(earningMatch[1]);
  }

  const bioRaw = (html.match(/>Bio<\/h2><p[^>]*>(.*?)<\/p>/is) || [])[1] || null;
  const bio_text = bioRaw ? decodeHtml(bioRaw) : null;

  const links = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
  const filteredLinks = links.filter((u) => !/immunefi\.com|firebasestorage|googletagmanager|zendesk|googleapis/i.test(u));

  let x_handle = null;
  let x_url = null;
  let x_confidence = 'low';

  const mentions = extractMentions(bio_text || '');
  if (mentions.length > 0) {
    x_handle = mentions[0];
    x_url = `https://x.com/${x_handle}`;
    x_confidence = 'high';
  }

  if (!x_handle) {
    const xCandidatesFromProfile = [];
    for (const m of html.matchAll(/https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[A-Za-z0-9_\/?:=&.%#-]+/gi)) {
      const candidate = extractXHandleFromUrl(m[0]);
      if (candidate) xCandidatesFromProfile.push(candidate);
    }
    const profileCandidate = [...new Set(xCandidatesFromProfile)].find((c) => c.toLowerCase() !== 'immunefi');
    if (profileCandidate) {
      x_handle = profileCandidate;
      x_url = `https://x.com/${profileCandidate}`;
      x_confidence = 'high';
    }
  }

  if (!x_handle) {
    try {
      const queries = [`${handle} Immunefi X`, `${handle} site:x.com`];
      for (const qRaw of queries) {
        const q = encodeURIComponent(qRaw);
        const search = curl(`https://duckduckgo.com/html/?q=${q}`);
        const candidates = collectSearchXCandidates(search);
        const best = candidates.find((c) => c.toLowerCase() === handle.toLowerCase())
          || candidates.find((c) => c.toLowerCase().includes(handle.toLowerCase()) || handle.toLowerCase().includes(c.toLowerCase()));
        if (best) {
          x_handle = best;
          x_url = `https://x.com/${best}`;
          x_confidence = 'medium';
          break;
        }
      }
    } catch {
      warnings.push(`X search failed for ${handle}`);
    }
  }

  const github_url = filteredLinks.find((u) => /github\.com\//i.test(u)) || null;
  const personal_site_url = filteredLinks.find((u) => !/github\.com|x\.com|twitter\.com/i.test(u)) || normalizeUrl(extractDomains(bio_text || '')[0] || null);

  const pfp_url = extractProfilePfpUrl(html, pfp_url_directory);

  return {
    pfp_url,
    member_since,
    all_time_rank,
    total_earnings_usd_profile,
    bio_text,
    bio_links: extractDomains(bio_text || '').map(normalizeUrl),
    links: {
      x_handle,
      x_url,
      x_confidence,
      github_url,
      personal_site_url,
    },
    total_saved_usd: null,
    impact_notes: 'Not provided by Immunefi pledge/profile pages; requires disclosure-level parsing.',
  };
}

async function main() {
  const warnings = ['Playwright runtime is not used in this environment; script uses deterministic curl HTML parsing fallback.'];
  const heroesByHandle = new Map();

  const page1 = curl(SOURCE_URL);
  const meta = extractMeta(page1);
  const totalPages = Math.max(extractTotalPages(page1), 12);

  let emptyPages = 0;
  for (let page = 1; page <= totalPages && emptyPages < 3; page += 1) {
    const html = page === 1 ? page1 : curl(`${SOURCE_URL}?page=${page}`);
    const srs = extractSrs(html);
    if (srs.length === 0) {
      emptyPages += 1;
      continue;
    }
    emptyPages = 0;
    for (const sr of srs) {
      if (!sr?.username) continue;
      const handle = sr.username;
      heroesByHandle.set(handle, {
        handle,
        rank: sr.ranking ?? null,
        bugs_found: sr.reportsCount ?? null,
        total_earned_usd: sr.totalEarnings != null ? Math.round(Number(sr.totalEarnings)) : null,
        imu_pledged: sr.totalStaked != null ? Math.round(Number(sr.totalStaked)) : null,
        pledgers: sr.totalBackers ?? null,
        pfp_url_directory: sr.pictureUrl ?? null,
        pledge_url: `https://immunefi.com/pledge/${handle}/`,
        profile_url: `https://immunefi.com/profile/${handle}/`,
      });
    }
  }

  const heroes = [...heroesByHandle.values()].sort((a, b) => a.rank - b.rank || a.handle.localeCompare(b.handle));

  for (let i = 0; i < heroes.length; i += 1) {
    const hero = heroes[i];
    process.stdout.write(`\rEnriching ${i + 1}/${heroes.length}: ${hero.handle}   `);
    const profile = extractProfile(hero, warnings);
    delete hero.pfp_url_directory;
    Object.assign(hero, profile);
  }
  process.stdout.write('\n');

  if ((meta.pledged_hackers_count ?? heroes.length) !== heroes.length) {
    warnings.push(`Directory count mismatch: meta=${meta.pledged_hackers_count}, extracted=${heroes.length}`);
  }
  if ((meta.pledged_hackers_count ?? heroes.length) !== EXPECTED_COUNT) {
    warnings.push(`Expected ${EXPECTED_COUNT} pledged hackers; observed ${meta.pledged_hackers_count ?? heroes.length}.`);
  }

  const payload = {
    meta: {
      source: 'immunefi-hacker-pledging',
      source_url: SOURCE_URL,
      pledged_hackers_count: meta.pledged_hackers_count ?? heroes.length,
      total_pledged_imu_raw: meta.total_pledged_imu_raw,
      total_pledged_imu: meta.total_pledged_imu,
      active_pledgers: meta.active_pledgers,
      extracted_at: new Date().toISOString(),
    },
    heroes,
    warnings,
  };

  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Immunefi Heroes Dataset',
    type: 'object',
    required: ['meta', 'heroes', 'warnings'],
    properties: {
      meta: {
        type: 'object',
        required: ['source', 'source_url', 'pledged_hackers_count', 'total_pledged_imu_raw', 'total_pledged_imu', 'active_pledgers', 'extracted_at'],
        properties: {
          source: { type: 'string' },
          source_url: { type: 'string' },
          pledged_hackers_count: { type: 'integer' },
          total_pledged_imu_raw: { type: ['string', 'null'] },
          total_pledged_imu: { type: ['integer', 'null'] },
          active_pledgers: { type: ['integer', 'null'] },
          extracted_at: { type: 'string' },
        },
        additionalProperties: false,
      },
      heroes: {
        type: 'array',
        items: {
          type: 'object',
          required: ['handle', 'pfp_url', 'rank', 'bugs_found', 'total_earned_usd', 'imu_pledged', 'pledgers', 'pledge_url', 'profile_url', 'member_since', 'all_time_rank', 'total_earnings_usd_profile', 'bio_text', 'bio_links', 'links', 'total_saved_usd', 'impact_notes'],
          properties: {
            handle: { type: 'string' },
            pfp_url: { type: 'string' },
            rank: { type: ['integer', 'null'] },
            bugs_found: { type: ['integer', 'null'] },
            total_earned_usd: { type: ['integer', 'null'] },
            imu_pledged: { type: ['integer', 'null'] },
            pledgers: { type: ['integer', 'null'] },
            pledge_url: { type: 'string' },
            profile_url: { type: 'string' },
            member_since: { type: ['string', 'null'] },
            all_time_rank: { type: ['integer', 'null'] },
            total_earnings_usd_profile: { type: ['integer', 'null'] },
            bio_text: { type: ['string', 'null'] },
            bio_links: { type: 'array', items: { type: 'string' } },
            links: {
              type: 'object',
              required: ['x_handle', 'x_url', 'x_confidence', 'github_url', 'personal_site_url'],
              properties: {
                x_handle: { type: ['string', 'null'] },
                x_url: { type: ['string', 'null'] },
                x_confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                github_url: { type: ['string', 'null'] },
                personal_site_url: { type: ['string', 'null'] },
              },
              additionalProperties: false,
            },
            total_saved_usd: { type: ['number', 'null'] },
            impact_notes: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
      warnings: { type: 'array', items: { type: 'string' } },
    },
    additionalProperties: false,
  };

  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
  await fs.writeFile(OUT_JSON, JSON.stringify(payload, null, 2) + '\n');
  await fs.writeFile(OUT_SCHEMA, JSON.stringify(schema, null, 2) + '\n');

  console.log(`Wrote ${heroes.length} heroes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
