const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PROTOCOLS_DIR = path.join(ROOT, 'public', 'protocols');
const OUTPUT_PATH = path.join(ROOT, 'data', 'whiteclaws_protocol_index.json');

function normalizeSlug(slug) {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function pickExistingFields(protocol) {
  return {
    source: protocol.source ?? null,
    url: protocol.url ?? null,
    website_url: protocol.website_url ?? null,
    github_url: protocol.github_url ?? null,
    docs_url: protocol.docs_url ?? null,
    bounty: protocol.bounty ?? null,
    program_tags: protocol.program_tags ?? [],
  };
}

function run() {
  if (!fs.existsSync(PROTOCOLS_DIR)) {
    throw new Error(`Protocol directory not found: ${PROTOCOLS_DIR}`);
  }

  const files = fs.readdirSync(PROTOCOLS_DIR).filter((f) => f.endsWith('.json')).sort();
  const entries = [];
  const slugToFiles = new Map();

  for (const file of files) {
    const filePath = path.join(PROTOCOLS_DIR, file);
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      entries.push({
        slug: null,
        normalized_slug: null,
        name: null,
        filepath: path.relative(ROOT, filePath),
        needs_review: true,
        issue: `invalid_json: ${error.message}`,
        existing_fields: null,
      });
      continue;
    }

    const slug = parsed.slug ?? null;
    const name = parsed.name ?? null;
    const normalizedSlug = normalizeSlug(slug);
    const needsReview = !slug || !name || slug !== normalizedSlug;
    const issue = !slug
      ? 'missing_slug'
      : !name
        ? 'missing_name'
        : slug !== normalizedSlug
          ? 'slug_normalization_mismatch'
          : null;

    entries.push({
      slug,
      normalized_slug: normalizedSlug || null,
      name,
      filepath: path.relative(ROOT, filePath),
      needs_review: Boolean(needsReview),
      issue,
      existing_fields: pickExistingFields(parsed),
    });

    if (slug) {
      const bucket = slugToFiles.get(slug) || [];
      bucket.push(path.relative(ROOT, filePath));
      slugToFiles.set(slug, bucket);
    }
  }

  const duplicates = [];
  for (const [slug, filesForSlug] of slugToFiles.entries()) {
    if (filesForSlug.length > 1) {
      duplicates.push({ slug, filepaths: filesForSlug });
      for (const row of entries) {
        if (row.slug === slug) {
          row.needs_review = true;
          row.issue = row.issue ? `${row.issue};duplicate_slug` : 'duplicate_slug';
        }
      }
    }
  }

  const output = {
    generated_at: new Date().toISOString(),
    protocol_dir: path.relative(ROOT, PROTOCOLS_DIR),
    total_files: files.length,
    total_indexed: entries.length,
    duplicates,
    protocols: entries.sort((a, b) => String(a.slug || '').localeCompare(String(b.slug || ''))),
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${OUTPUT_PATH} (${output.total_indexed} entries)`);
}

run();
