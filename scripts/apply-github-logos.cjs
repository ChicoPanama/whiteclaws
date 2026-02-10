const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'public', 'protocols');

// GitHub organization avatar logos for protocols not found in DeFi Llama
const GITHUB_LOGOS = {
  'daimo': 'https://avatars.githubusercontent.com/u/134016513?s=200&v=4',
  'daimo-pay': 'https://avatars.githubusercontent.com/u/134016513?s=200&v=4',
  'pantos': 'https://avatars.githubusercontent.com/u/41996103?s=200&v=4',
  'xterio': 'https://avatars.githubusercontent.com/u/106751507?s=200&v=4',
  'baanx': 'https://avatars.githubusercontent.com/u/219131438?v=4',
  'cyan': 'https://avatars.githubusercontent.com/u/111743518?s=200&v=4',
  'drips': 'https://avatars.githubusercontent.com/u/141408581?s=200&v=4',
  'eco': 'https://avatars.githubusercontent.com/u/114431110?s=200&v=4',
  'light-protocol': 'https://avatars.githubusercontent.com/u/92580952?s=200&v=4',
  'intmax': 'https://avatars.githubusercontent.com/u/74763454?s=200&v=4',
  'zkverify': 'https://avatars.githubusercontent.com/u/166552449?s=200&v=4',
  'glodollar': 'https://avatars.githubusercontent.com/u/131250622?s=200&v=4',
  'ringdao': 'https://avatars.githubusercontent.com/u/139533974?s=200&v=4',
  'fbtc': 'https://avatars.githubusercontent.com/u/169960161?s=200&v=4',
  'blockwallet': 'https://avatars.githubusercontent.com/u/76740794?s=200&v=4',

  // Round 2 - from background agent GitHub search
  'avalabs': 'https://avatars.githubusercontent.com/u/44277073?s=200&v=4',
  'bitswift': 'https://avatars.githubusercontent.com/u/1194983?s=200&v=4',
  'cc-protocol': 'https://avatars.githubusercontent.com/u/243570915?s=200&v=4',
  'hathornetwork': 'https://avatars.githubusercontent.com/u/40426718?s=200&v=4',
  'monero-oxide': 'https://avatars.githubusercontent.com/u/179411563?s=200&v=4',
  'mtpelerin': 'https://avatars.githubusercontent.com/u/35845630?s=200&v=4',
  'serai': 'https://avatars.githubusercontent.com/u/104170959?s=200&v=4',
  'usdn': 'https://avatars.githubusercontent.com/u/62963293?s=200&v=4',
  'usx': 'https://avatars.githubusercontent.com/u/48235975?s=200&v=4',
  'waymont': 'https://avatars.githubusercontent.com/u/118851644?s=200&v=4',
  'qblockchain': 'https://avatars.githubusercontent.com/u/183797849?s=200&v=4',
  'alpen-labs': 'https://avatars.githubusercontent.com/u/113091135?s=200&v=4',
  'kinesis-bridge-on-kadena': 'https://avatars.githubusercontent.com/u/19830776?s=200&v=4',
};

let updated = 0;
for (const [slug, logo] of Object.entries(GITHUB_LOGOS)) {
  const filePath = path.join(dir, slug + '.json');
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (data.logo_url && data.logo_url !== null) continue;
  data.logo_url = logo;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  updated++;
}

console.log('Applied GitHub avatar logos to ' + updated + ' protocols');

// Final count
let withLogo = 0, withoutLogo = 0;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== '_index.json' && f !== 'protocol_template.json');
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
  if (d.logo_url && d.logo_url !== null) withLogo++;
  else withoutLogo++;
}
console.log('Final: ' + withLogo + ' with logos, ' + withoutLogo + ' without');
