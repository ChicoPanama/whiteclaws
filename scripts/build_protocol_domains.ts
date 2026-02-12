import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const INDEX_PATH = path.join(ROOT, 'data', 'whiteclaws_protocol_index.json');
const DENYLIST_PATH = path.join(ROOT, 'data', 'domain_denylist.json');
const OUTPUT = path.join(ROOT, 'data', 'protocol_domains.json');

function curlGet(url: string): string | null {
  try { return execFileSync('curl', ['-fsSL', '--max-time', '20', url], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 50 * 1024 * 1024 }); } catch { return null; }
}
function hostFromUrl(input: string): string | null { try { return new URL(input).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; } }
function denylisted(host: string, deny: { deny_exact: string[]; deny_contains: string[] }): boolean { return deny.deny_exact.includes(host) || deny.deny_contains.some((d) => host.includes(d)); }

function run() {
  const deny = JSON.parse(fs.readFileSync(DENYLIST_PATH, 'utf8')) as { deny_exact: string[]; deny_contains: string[] };
  const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8')) as { protocols: Array<{ slug: string | null; name: string | null }> };

  const llamaText = curlGet('https://api.llama.fi/protocols') ?? '[]';
  const llama = JSON.parse(llamaText) as Array<Record<string, unknown>>;
  const bySlug = new Map<string, Record<string, unknown>>();
  const byName = new Map<string, Record<string, unknown>>();
  for (const item of llama) {
    const s = typeof item.slug === 'string' ? item.slug.toLowerCase() : null;
    const n = typeof item.name === 'string' ? item.name.toLowerCase() : null;
    if (s) bySlug.set(s, item);
    if (n) byName.set(n, item);
  }

  const out: Record<string, unknown> = {};
  for (const p of idx.protocols) {
    if (!p.slug || !p.name) continue;
    const cand = bySlug.get(p.slug.toLowerCase()) ?? byName.get(p.name.toLowerCase()) ?? null;
    const rawUrl = cand && typeof cand.url === 'string' ? cand.url : cand && typeof cand.website === 'string' ? cand.website : null;
    const host = rawUrl ? hostFromUrl(rawUrl) : null;
    const okHost = host && !denylisted(host, deny) ? host : null;
    out[p.slug] = {
      slug: p.slug,
      name: p.name,
      domain: okHost,
      url: okHost ? `https://${okHost}` : null,
      confidence: okHost ? 0.9 : 0,
      candidates: okHost ? [{ domain: okHost, url: `https://${okHost}`, source: 'https://api.llama.fi/protocols', confidence: 0.9 }] : [],
      sources: okHost ? ['https://api.llama.fi/protocols'] : [],
      needs_review: !okHost,
      reason: okHost ? null : 'domain_unresolved'
    };
  }

  fs.writeFileSync(OUTPUT, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`wrote ${OUTPUT}`);
}

run();
