const fs = require('fs');
const path = require('path');

// Read DeFi Llama slugs
const llamaSlugs = new Set(
  fs.readFileSync('/tmp/defillama_slugs.txt', 'utf-8')
    .trim()
    .split('\n')
    .map(s => s.trim().toLowerCase())
);

// Read our missing protocols
const dir = path.join(__dirname, '..', 'public', 'protocols');
const files = fs.readdirSync(dir).filter(f =>
  f.endsWith('.json') && f !== '_index.json' && f !== 'protocol_template.json'
);

const missing = [];
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
  if (!d.logo_url || d.logo_url === null) {
    missing.push({ slug: f.replace('.json', ''), name: d.name });
  }
}

console.log('Missing protocols:', missing.length);
console.log('DeFi Llama slugs:', llamaSlugs.size);

// Try to match using various slug transformations
const matches = [];
const noMatch = [];

for (const p of missing) {
  const slug = p.slug;
  const name = p.name.toLowerCase();

  // Build candidate slugs
  const candidates = new Set();

  // Exact slug
  candidates.add(slug);

  // Name-based: lowercase, hyphens for spaces
  candidates.add(name.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));

  // Remove common suffixes
  const suffixes = ['protocol', 'finance', 'network', 'dao', 'swap', 'labs', 'xyz', 'fi'];
  for (const suf of suffixes) {
    if (slug.endsWith(suf)) {
      candidates.add(slug.slice(0, -suf.length));
      candidates.add(slug.slice(0, -suf.length) + '-' + suf);
    }
  }

  // Add hyphens before version numbers
  candidates.add(slug.replace(/v(\d)/, '-v$1'));

  // Try inserting hyphens at common word boundaries
  const words = ['finance', 'protocol', 'swap', 'bridge', 'yield', 'defi', 'lend',
    'market', 'pool', 'chain', 'dex', 'dao', 'network', 'labs', 'ecosystem',
    'wallet', 'capital', 'fi', 'farm', 'vault', 'stake', 'liquid'];
  for (const w of words) {
    const idx = slug.indexOf(w);
    if (idx > 0 && slug[idx - 1] !== '-') {
      candidates.add(slug.slice(0, idx) + '-' + slug.slice(idx));
    }
  }

  // Try just the first word of the name
  const firstName = name.split(/\s+/)[0].replace(/[^a-z0-9]/g, '');
  candidates.add(firstName);

  // Try known manual mappings
  const manualMap = {
    '88mphv3': '88mph',
    'beethovenx': 'beethoven-x',
    'bifi': 'beefy',
    'bprotocol': 'b.protocol',
    'justlenddao': 'justlend',
    'mantlelsp': 'mantle-lsp',
    'dodov3': 'dodo',
    'folksfinance': 'folks-finance',
    'hakkafinance': 'hakka-finance',
    'extrafinance': 'extra-finance',
    'lybrafinance': 'lybra-finance',
    'dfxfinance': 'dfx-finance',
    'silofinance': 'silo-finance',
    'olafinance': 'ola-finance',
    'strikefinance': 'strike-finance',
    'inversefinance': 'inverse-finance',
    'inverse-finance': 'inverse-finance',
    'reaperfarm': 'reaper-farm',
    'shellprotocol': 'shell-protocol',
    'ref-finance': 'ref-finance',
    'gammaswap': 'gamma-swap',
    'stellaswap': 'stellaswap',
    'pstakeoncosmos': 'pstake-finance',
    'metastreet': 'metastreet',
    'nftfi': 'nftfi',
    'summerfi': 'summer.fi',
    'singularitydao': 'singularity-dao',
    'impossiblefinance': 'impossible-finance',
    'rangeprotocol': 'range-protocol',
    'bondprotocol': 'bond-protocol',
    'primitivefinance': 'primitive',
    'primitive': 'primitive',
    'mountainprotocol': 'mountain-protocol',
    'moneyonchain': 'money-on-chain',
    'opyngamma': 'opyn',
    'opynsqueeth': 'opyn',
    'gogopool': 'gogopool',
    'overlayprotocol': 'overlay',
    'overlay': 'overlay-protocol',
    'symbiosis': 'symbiosis-finance',
    'velvetcapital': 'velvet-capital',
    'velvet-capital-v2': 'velvet-capital',
    'wildcatprotocol': 'wildcat',
    'stakelink': 'stake.link',
    'stackingdao': 'stackingdao',
    'teahousefinance': 'teahouse',
    'vaultcraft': 'vaultcraft',
    'timelessandbunni': 'timeless',
    'origindefi': 'origin-defi',
    'burrow': 'burrow',
    'econia': 'econia',
    'degate': 'degate',
    'hydradx': 'hydradx',
    'thala-protocol': 'thala',
    'landx': 'landx-finance',
    'ensuro': 'ensuro',
    'spectral': 'spectral',
    'zodiac': 'zodiac',
    'basilisx': 'basilisk',
    'basilisk': 'basilisk',
    'charm': 'charm-finance',
    'pods': 'pods-finance',
    'tetu': 'tetu',
    'resonate': 'resonate',
    'myntandzero': 'mynt',
    'revest': 'revest-finance',
    'pikaprotocol': 'pika-protocol',
    'predyfinance': 'predy-finance',
    'segmentfinance': 'segment-finance',
    'swappi': 'swappi',
    'poolshark': 'poolshark',
    'termstructurelabs': 'term-finance',
    'baofinance': 'bao-finance',
    'marsecosystem': 'mars-ecosystem',
    'davos': 'davos-protocol',
    'duetfinance': 'duet-finance',
    'integriteenetwork': 'integritee',
    'metalswap': 'metalswap',
    'tropykus': 'tropykus',
    'securefi': 'securefi',
    'localtraders': 'local-traders',
    'blockwallet': 'block-wallet',
    'parallelwallet': 'parallel',
    'gerowallet': 'gero-wallet',
    'unstoppablewallet': 'unstoppable-wallet',
    'universalpage': 'universal-page',
    'magpiexyz': 'magpie',
    'pragmaoracle': 'pragma',
    'liquidswap': 'liquidswap',
    'geniusyield': 'genius-yield',
    'ebtc': 'ebtc',
    'ostium': 'ostium',
    'vesu': 'vesu',
    'yelay': 'yelay',
    'yieldnest': 'yieldnest',
    'pareto': 'pareto',
    'pinto': 'pinto',
    'royco': 'royco',
    'cove': 'cove',
    'foil': 'foil',
    'halogen': 'halogen',
    'hydro': 'hydro-protocol',
    'router': 'router-protocol',
    'bitflow': 'bitflow',
    'ion-protocol': 'ion-protocol',
    'lombard-finance': 'lombard',
    'omni-network': 'omni',
    'light-protocol': 'light-protocol',
    'granite-protocol': 'granite',
    'zest-protocol-v2': 'zest-protocol',
  };

  if (manualMap[slug]) {
    candidates.add(manualMap[slug]);
  }

  let found = false;
  for (const c of candidates) {
    if (llamaSlugs.has(c)) {
      matches.push({ slug: p.slug, llamaSlug: c, name: p.name });
      found = true;
      break;
    }
  }
  if (!found) noMatch.push(p);
}

console.log('\nMatched:', matches.length);
console.log('No match:', noMatch.length);

console.log('\n=== MATCHES ===');
matches.forEach(m => console.log(m.slug + ' -> ' + m.llamaSlug));

console.log('\n=== NO MATCH ===');
noMatch.forEach(m => console.log(m.slug + ' (' + m.name + ')'));
