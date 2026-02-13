import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const INDEX_PATH = path.join(ROOT, 'data', 'whiteclaws_protocol_index.json');
const DENYLIST_PATH = path.join(ROOT, 'data', 'domain_denylist.json');
const CURATED_PATH = path.join(ROOT, 'data', 'curated_domains.json');
const OUTPUT = path.join(ROOT, 'data', 'protocol_domains.json');

function curlGet(url: string): string | null {
  try {
    return execFileSync('curl', ['-fsSL', '--max-time', '20', url], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 50 * 1024 * 1024,
    });
  } catch { return null; }
}

function hostFromUrl(input: string): string | null {
  try { return new URL(input).hostname.toLowerCase().replace(/^www\./, '') || null; } catch { return null; }
}

function denylisted(host: string, deny: { deny_exact: string[]; deny_contains: string[] }): boolean {
  return deny.deny_exact.includes(host) || deny.deny_contains.some((d) => host.includes(d));
}

function normalize(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }

type LlamaProto = Record<string, unknown>;

function tryResolve(
  slug: string, name: string, bySlug: Map<string, LlamaProto>, byName: Map<string, LlamaProto>,
  byPrefix: Map<string, LlamaProto[]>, llama: LlamaProto[], deny: { deny_exact: string[]; deny_contains: string[] },
): { domain: string; url: string; confidence: number; method: string } | null {
  const extractOk = (item: LlamaProto) => {
    const u = typeof item.url === 'string' ? item.url : '';
    const h = hostFromUrl(u);
    return h && !denylisted(h, deny) ? { domain: h, url: u } : null;
  };

  // 1. Exact slug
  const es = bySlug.get(slug);
  if (es) { const r = extractOk(es); if (r) return { ...r, confidence: 0.95, method: 'exact_slug' }; }

  // 2. Exact name
  const en = byName.get(name.toLowerCase());
  if (en) { const r = extractOk(en); if (r) return { ...r, confidence: 0.9, method: 'exact_name' }; }

  // 3. Prefix match — strip common suffixes and pick highest TVL
  const base = slug.replace(/(finance|protocol|network|dao|chain|swap|defi|labs)$/i, '');
  const candidates = byPrefix.get(base);
  if (candidates?.length) {
    const sorted = [...candidates].sort((a, b) => ((b.tvl as number) ?? 0) - ((a.tvl as number) ?? 0));
    const r = extractOk(sorted[0]);
    if (r) return { ...r, confidence: 0.85, method: 'prefix' };
  }

  // 4. Normalized fuzzy name
  const normSlug = normalize(slug);
  for (const lp of llama) {
    const ln = normalize(typeof lp.name === 'string' ? lp.name : '');
    if (ln && ln.length >= 3 && (ln === normSlug || ln.startsWith(normSlug) || normSlug.startsWith(ln))) {
      const r = extractOk(lp);
      if (r) return { ...r, confidence: 0.8, method: 'normalized' };
    }
  }

  return null;
}

function run() {
  const deny = JSON.parse(fs.readFileSync(DENYLIST_PATH, 'utf8'));
  const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8')) as { protocols: Array<{ slug: string | null; name: string | null }> };
  const curated: Record<string, string> = fs.existsSync(CURATED_PATH) ? JSON.parse(fs.readFileSync(CURATED_PATH, 'utf8')) : {};

  // Fetch DefiLlama
  const llamaText = curlGet('https://api.llama.fi/protocols') ?? '[]';
  const llama = JSON.parse(llamaText) as LlamaProto[];

  // Build indices
  const bySlug = new Map<string, LlamaProto>();
  const byName = new Map<string, LlamaProto>();
  const byPrefix = new Map<string, LlamaProto[]>();
  for (const item of llama) {
    const s = typeof item.slug === 'string' ? item.slug.toLowerCase() : '';
    const n = typeof item.name === 'string' ? item.name.toLowerCase() : '';
    if (!item.url) continue;
    if (s) bySlug.set(s, item);
    if (n) byName.set(n, item);
    const base = s.split('-')[0];
    if (base) { const arr = byPrefix.get(base) ?? []; arr.push(item); byPrefix.set(base, arr); }
  }

  const out: Record<string, unknown> = {};
  let resolved = 0;

  for (const p of idx.protocols) {
    if (!p.slug || !p.name) continue;
    const match = tryResolve(p.slug, p.name, bySlug, byName, byPrefix, llama, deny);
    if (match) {
      out[p.slug] = { slug: p.slug, name: p.name, domain: match.domain, url: match.url, confidence: match.confidence, method: match.method, sources: ['defillama'], needs_review: false, reason: null };
      resolved++;
    } else if (curated[p.slug]) {
      out[p.slug] = { slug: p.slug, name: p.name, domain: curated[p.slug], url: 'https://' + curated[p.slug], confidence: 0.85, method: 'curated', sources: ['curated'], needs_review: false, reason: null };
      resolved++;
    } else {
      out[p.slug] = { slug: p.slug, name: p.name, domain: null, url: null, confidence: 0, method: 'unresolved', sources: [], needs_review: true, reason: 'domain_unresolved' };
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(out, null, 2) + '\n');
  console.log('wrote ' + OUTPUT + ' — ' + resolved + '/' + Object.keys(out).length + ' resolved');
}

run();
