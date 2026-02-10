import fs from 'fs';
import path from 'path';

const SNAPSHOT_URL = 'https://raw.githubusercontent.com/pratraut/Immunefi-Bug-Bounty-Programs-Snapshots/main/projects.json';
const PROTOCOLS_DIR = path.join(process.cwd(), 'public', 'protocols');

// Category mapping
const CATEGORY_MAP = {
  'Blockchain': 'L2 / L1',
  'Blockchain/Layer 1': 'L2 / L1',
  'Blockchain/Layer 2': 'Layer 2',
  'Bridge': 'Bridge',
  'CDP': 'DeFi',
  'Cross Chain': 'Bridge',
  'CeFi': 'DeFi',
  'DeFi': 'DeFi',
  'DEX': 'DEX',
  'Derivatives': 'DeFi Trading',
  'Exchange': 'DeFi Trading',
  'Gaming': 'Gaming/NFT',
  'Generic': 'Infrastructure',
  'Infrastructure': 'Infrastructure',
  'Insurance': 'DeFi',
  'Lending': 'DeFi Lending',
  'Liquid Staking': 'DeFi Staking',
  'NFT': 'Gaming/NFT',
  'Oracle': 'Infrastructure',
  'Other': 'Infrastructure',
  'Payment': 'Infrastructure',
  'Privacy': 'Privacy',
  'Protocol': 'DeFi',
  'RWA': 'RWA Tokenization',
  'Stablecoin': 'DeFi Stablecoin',
  'Staking': 'DeFi Staking',
  'Yield': 'DeFi Yield',
  'Yield Aggregator': 'DeFi Yield',
  'Wallet': 'Infrastructure',
  'DAO': 'DeFi',
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseMaxBounty(str) {
  if (!str) return 0;
  const s = String(str).replace(/[,$\s]/g, '');
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

function normalizeCategory(cat) {
  if (!cat) return 'DeFi';
  return CATEGORY_MAP[cat] || cat;
}

async function main() {
  console.log('Fetching Immunefi projects snapshot...');
  const resp = await fetch(SNAPSHOT_URL);
  if (!resp.ok) {
    throw new Error(`Fetch failed: ${resp.status}`);
  }
  const data = await resp.json();

  // data is an array of program objects
  const programs = Array.isArray(data) ? data : (data.programs || data.data || []);
  console.log(`Found ${programs.length} programs in snapshot`);

  // Read existing slugs
  const existingSlugs = new Set();
  const existingFiles = fs.readdirSync(PROTOCOLS_DIR).filter(f => f.endsWith('.json') && f !== '_index.json' && f !== 'protocol_template.json');
  for (const f of existingFiles) {
    existingSlugs.add(f.replace('.json', ''));
  }
  console.log(`Already have ${existingSlugs.size} protocol files`);

  let created = 0;
  const allSlugs = new Set(existingSlugs);

  for (const p of programs) {
    const name = p.project || p.name || '';
    if (!name) continue;

    // Try to get slug from the data, otherwise generate one
    let slug = p.id || p.slug || slugify(name);
    slug = slugify(slug);

    if (!slug || slug === '') continue;
    if (allSlugs.has(slug)) continue;

    const maxBounty = parseMaxBounty(p.maximumReward || p.maxBounty || p.max_bounty || 0);
    const category = normalizeCategory(p.productType || p.category || 'DeFi');
    const chains = [];

    // Parse chains/ecosystem
    if (p.ecosystem) {
      const eco = Array.isArray(p.ecosystem) ? p.ecosystem : [p.ecosystem];
      for (const e of eco) {
        if (typeof e === 'string') chains.push(e.toLowerCase());
      }
    }
    if (chains.length === 0 && p.chains) {
      const ch = Array.isArray(p.chains) ? p.chains : [p.chains];
      for (const c of ch) {
        if (typeof c === 'string') chains.push(c.toLowerCase());
      }
    }
    if (chains.length === 0) chains.push('ethereum');

    const logoUrl = p.logo || p.logo_url || null;
    const description = p.description || `${name} bug bounty program on Immunefi`;

    // Determine severity payouts based on max bounty
    const critMax = maxBounty;
    const critMin = Math.max(Math.floor(maxBounty * 0.25), 1000);
    const highMax = Math.max(Math.floor(maxBounty * 0.1), 5000);
    const highMin = Math.max(Math.floor(maxBounty * 0.01), 1000);
    const medMax = Math.max(Math.floor(maxBounty * 0.01), 1000);
    const medMin = Math.max(Math.floor(maxBounty * 0.001), 500);

    const protocol = {
      slug,
      name,
      description: typeof description === 'string' ? description.slice(0, 300) : `${name} bug bounty program`,
      category,
      logo_url: logoUrl,
      chains,
      bounty: {
        max: maxBounty,
        min: medMin,
        kyc_required: p.kyc === true || p.kycRequired === true || false,
        payout_token: 'USDC',
      },
      severity_payouts: {
        critical: {
          min: critMin,
          max: critMax,
          description: 'Direct theft of user funds or protocol insolvency',
        },
        high: {
          min: highMin,
          max: highMax,
          description: 'Temporary freezing of funds or manipulation',
        },
        medium: {
          min: medMin,
          max: medMax,
          description: 'Griefing or protocol disruption',
        },
      },
      source: 'immunefi',
      contracts: [],
      scope: {
        in_scope: ['Smart contracts in scope per Immunefi listing'],
        out_of_scope: ['Frontend applications', 'Off-chain infrastructure'],
      },
      updated_at: new Date().toISOString(),
    };

    const filePath = path.join(PROTOCOLS_DIR, `${slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(protocol, null, 2) + '\n');
    allSlugs.add(slug);
    created++;
  }

  console.log(`Created ${created} new protocol files`);
  console.log(`Total protocols: ${allSlugs.size}`);

  // Update _index.json
  const sortedSlugs = [...allSlugs].sort();
  const index = {
    protocols: sortedSlugs.map(s => ({ slug: s })),
    count: sortedSlugs.length,
  };
  fs.writeFileSync(
    path.join(PROTOCOLS_DIR, '_index.json'),
    JSON.stringify(index, null, 2) + '\n'
  );
  console.log(`Updated _index.json with ${sortedSlugs.length} protocols`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
