import fs from 'node:fs';
import path from 'node:path';

type ProtocolIndexEntry = {
  slug: string | null;
  name: string | null;
  filepath: string;
  chains: string[];
  logo_url: string | null;
  metadata: Record<string, unknown>;
  needs_review: boolean;
  issue: string | null;
};

const ROOT = process.cwd();
const PROTOCOLS_DIR = path.join(ROOT, 'public', 'protocols');
const OUTPUT = path.join(ROOT, 'data', 'whiteclaws_protocol_index.json');

function run() {
  const files = fs.readdirSync(PROTOCOLS_DIR).filter((f) => f.endsWith('.json')).sort();
  const entries: ProtocolIndexEntry[] = [];
  const slugs = new Map<string, string[]>();

  for (const file of files) {
    const abs = path.join(PROTOCOLS_DIR, file);
    const rel = path.relative(ROOT, abs);
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(fs.readFileSync(abs, 'utf8'));
    } catch (error) {
      entries.push({
        slug: null,
        name: null,
        filepath: rel,
        chains: [],
        logo_url: null,
        metadata: {},
        needs_review: true,
        issue: `invalid_json:${(error as Error).message}`,
      });
      continue;
    }

    const slug = typeof json.slug === 'string' ? json.slug : null;
    const name = typeof json.name === 'string' ? json.name : null;
    const chains = Array.isArray(json.chains) ? json.chains.filter((c): c is string => typeof c === 'string') : [];
    const logo = typeof json.logo_url === 'string' ? json.logo_url : null;

    const metadataKeys = ['source', 'category', 'bounty', 'program_tags', 'contracts', 'scope', 'url', 'website_url', 'github_url', 'docs_url'];
    const metadata: Record<string, unknown> = {};
    for (const key of metadataKeys) {
      if (key in json) metadata[key] = json[key];
    }

    const issue = slug === null ? 'missing_slug' : name === null ? 'missing_name' : null;
    entries.push({ slug, name, filepath: rel, chains, logo_url: logo, metadata, needs_review: Boolean(issue), issue });

    if (slug) {
      const bucket = slugs.get(slug) ?? [];
      bucket.push(rel);
      slugs.set(slug, bucket);
    }
  }

  const duplicates = [...slugs.entries()].filter(([, filesForSlug]) => filesForSlug.length > 1).map(([slug, filesForSlug]) => ({ slug, filepaths: filesForSlug }));

  for (const d of duplicates) {
    for (const e of entries) {
      if (e.slug === d.slug) {
        e.needs_review = true;
        e.issue = e.issue ? `${e.issue};duplicate_slug` : 'duplicate_slug';
      }
    }
  }

  const out = {
    generated_at: new Date().toISOString(),
    protocol_dir: path.relative(ROOT, PROTOCOLS_DIR),
    total_files: files.length,
    total_protocol_entries: entries.length,
    duplicates,
    protocols: entries,
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log(`wrote ${OUTPUT}`);
}

run();
