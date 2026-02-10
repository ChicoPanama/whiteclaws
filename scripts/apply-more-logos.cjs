const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'public', 'protocols');

// More CoinGecko logos for remaining known protocols
const MORE_LOGOS = {
  'alephzero': 'https://assets.coingecko.com/coins/images/17212/small/aZero.png',
  'aleo': 'https://assets.coingecko.com/coins/images/29845/small/aleo.png',
  'arkham': 'https://assets.coingecko.com/coins/images/30929/small/arkham.png',
  'autonolas': 'https://assets.coingecko.com/coins/images/31814/small/olas.png',
  'avail': 'https://assets.coingecko.com/coins/images/36498/small/avail.png',
  'bitcoinsv': 'https://assets.coingecko.com/coins/images/6799/small/BSV.png',
  'cardanofoundation': 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  'composablefinance': 'https://assets.coingecko.com/coins/images/18176/small/composable.png',
  'darwinia': 'https://assets.coingecko.com/coins/images/11836/small/darwinia.png',
  'enzymefinance': 'https://assets.coingecko.com/coins/images/605/small/Enzyme.png',
  'exodus': 'https://assets.coingecko.com/coins/images/36498/small/exodus.png',
  'farcaster': 'https://assets.coingecko.com/coins/images/36498/small/farcaster.png',
  'furucombo': 'https://assets.coingecko.com/coins/images/14078/small/furucombo.png',
  'hedera': 'https://assets.coingecko.com/coins/images/3688/small/hbar.png',
  'ichi': 'https://assets.coingecko.com/coins/images/13119/small/ICHI.png',
  'idex': 'https://assets.coingecko.com/coins/images/2565/small/idex.png',
  'idlefinance': 'https://assets.coingecko.com/coins/images/13286/small/idle.png',
  'immunefi': 'https://assets.coingecko.com/coins/images/20819/small/immunefi.png',
  'jito': 'https://assets.coingecko.com/coins/images/33228/small/jito.png',
  'jito-foundation': 'https://assets.coingecko.com/coins/images/33228/small/jito.png',
  'keep3rnetwork': 'https://assets.coingecko.com/coins/images/12966/small/kp3r_logo.jpg',
  'lifi': 'https://assets.coingecko.com/coins/images/28862/small/lifi.png',
  'oasis': 'https://assets.coingecko.com/coins/images/13162/small/rose.png',
  'octopusnetwork': 'https://assets.coingecko.com/coins/images/18025/small/oct.png',
  'openzeppelin': 'https://pbs.twimg.com/profile_images/1574729573595914240/gY8NHdmP_400x400.jpg',
  'pnetwork': 'https://assets.coingecko.com/coins/images/11767/small/pNetwork.png',
  'rai': 'https://assets.coingecko.com/coins/images/14004/small/RAI-logo-coin.png',
  'sora': 'https://assets.coingecko.com/coins/images/11088/small/sora.png',
  'stafi': 'https://assets.coingecko.com/coins/images/12202/small/StaFi_Logo.png',
  'stakewise': 'https://assets.coingecko.com/coins/images/14563/small/StakeWise.png',
  'tinyman': 'https://assets.coingecko.com/coins/images/23290/small/tinyman.png',
  'tinymanv2': 'https://assets.coingecko.com/coins/images/23290/small/tinyman.png',
  'vesper': 'https://assets.coingecko.com/coins/images/13527/small/vesper.png',
  'zerion': 'https://assets.coingecko.com/coins/images/31468/small/zerion.png',
  'zerolend': 'https://assets.coingecko.com/coins/images/36059/small/zerolend.png',
  'polygonzkevm': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  'lidoonpolygon': 'https://assets.coingecko.com/coins/images/18523/small/ldo.png',
  'staderforbnb': 'https://assets.coingecko.com/coins/images/20861/small/sd.png',
  'staderforpolygon': 'https://assets.coingecko.com/coins/images/20861/small/sd.png',
  'alex': 'https://assets.coingecko.com/coins/images/22399/small/alex.png',
  'harvest': 'https://assets.coingecko.com/coins/images/12210/small/farm.png',
  'gamma': 'https://assets.coingecko.com/coins/images/19499/small/gamma.png',
  'astroport': 'https://assets.coingecko.com/coins/images/26044/small/astroport.png',
  'lossless': 'https://assets.coingecko.com/coins/images/15653/small/lossless.png',
  'pillar': 'https://assets.coingecko.com/coins/images/809/small/v2logo-pillar.png',
  'xion': 'https://assets.coingecko.com/coins/images/37562/small/xion.png',
  'zano': 'https://assets.coingecko.com/coins/images/5756/small/zano.png',
  'nominex': 'https://assets.coingecko.com/coins/images/13683/small/nominex.png',
  'mux': 'https://assets.coingecko.com/coins/images/28266/small/mux.png',
  'popsicle': 'https://assets.coingecko.com/coins/images/14586/small/ice.png',
  'toucan': 'https://assets.coingecko.com/coins/images/24017/small/toucan.png',
  'uniswaponzksync': 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg',
  'nomad': 'https://assets.coingecko.com/coins/images/26854/small/nomad.png',
  'ambire': 'https://assets.coingecko.com/coins/images/20126/small/ambire.png',
  'portfinance': 'https://assets.coingecko.com/coins/images/20427/small/port.png',
  'virtuals-protocol': 'https://assets.coingecko.com/coins/images/32257/small/virtuals.png',
  'orderlynetwork': 'https://assets.coingecko.com/coins/images/36205/small/orderly.png',
  'elixirprotocol': 'https://assets.coingecko.com/coins/images/37015/small/elixir.png',
  'plume-network': 'https://assets.coingecko.com/coins/images/37210/small/plume.png',
  'apecoinmainnet': 'https://assets.coingecko.com/coins/images/24383/small/apecoin.jpg',
  'betafinance': 'https://assets.coingecko.com/coins/images/18715/small/beta.png',
  'wepiggy': 'https://assets.coingecko.com/coins/images/18157/small/wepiggy.png',
};

let updated = 0;
for (const [slug, logo] of Object.entries(MORE_LOGOS)) {
  const filePath = path.join(dir, slug + '.json');
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (data.logo_url && data.logo_url !== null) continue;
  data.logo_url = logo;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  updated++;
}

console.log('Updated ' + updated + ' more protocols with logos');

// Final count
let withLogo = 0, withoutLogo = 0;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== '_index.json' && f !== 'protocol_template.json');
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
  if (d.logo_url && d.logo_url !== null) withLogo++;
  else withoutLogo++;
}
console.log('Final: ' + withLogo + ' with logos, ' + withoutLogo + ' without');
