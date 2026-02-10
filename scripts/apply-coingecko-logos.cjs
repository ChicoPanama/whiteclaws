// Apply cryptocurrency logos from spothq/cryptocurrency-icons GitHub repo
// Icons available at: https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/{SYMBOL}.png
const fs = require('fs');
const path = require('path');

const PROTOCOLS_DIR = path.join(__dirname, '..', 'public', 'protocols');
const ICON_BASE = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color';

// Map protocol slugs/names to cryptocurrency icon symbols (lowercase)
// Based on the manifest from spothq/cryptocurrency-icons
const SLUG_TO_SYMBOL = {
  // DeFi Protocols
  'aave': 'aave',
  'compoundfinance': 'comp',
  'balancer': 'bal',
  'sushiswap': 'sushi',
  'pancakeswap': 'cake', // not in manifest but worth trying
  'synthetix': 'snx',
  'yearnfinance': 'yfi',
  'cowprotocol': 'cow',  // may not exist
  'instadapp': 'inst',   // may not exist
  'ankr': 'ankr',
  'chainlink': 'link',
  'lido': 'ldo',         // may not exist
  'eigenlayer': 'eigen',  // may not exist
  'arbitrum': 'arb',     // may not exist
  'optimism': 'op',      // may not exist
  'polygon': 'matic',
  'starknet': 'strk',   // may not exist
  'filecoin': 'fil',
  'decentraland': 'mana',
  'ens': 'ens',          // may not exist
  'ethena': 'ena',       // may not exist
  'raydium': 'ray',
  'livepeer': 'lpt',
  'thegraph': 'grt',
  'nexusmutual': 'nxm',  // may not exist
  'pooltogether': 'pool', // may not exist
  'badger': 'badger',    // may not exist
  'tokemak': 'toke',     // may not exist
  'forta': 'fort',       // may not exist
  'biconomy': 'bico',    // may not exist
  'dforce': 'df',        // may not exist
  'superfluid': 'sf',    // may not exist
  'pendle': 'pendle',    // may not exist
  'morpho': 'morpho',    // may not exist
  'injective': 'inj',    // may not exist
  'sei': 'sei',          // may not exist
  'icon': 'icx',
  'illuvium': 'ilv',     // may not exist
  'dodo': 'dodo',        // may not exist
  'goldfinch': 'gfi',    // may not exist
  'radiant': 'rdnt',     // may not exist
  'moonwell': 'well',    // may not exist
  'sommelier': 'somm',   // may not exist
  'velodromefinance': 'velo', // may not exist
  'thorchain': 'rune',   // may not exist
  'stacks': 'stx',
  'obyte': 'gbyte',
  'neo': 'neo',
  'hashflow': 'hft',     // may not exist
  'galagames': 'gala',   // may not exist
  'bonfida': 'fida',

  // Infrastructure & L2
  'avalanche': 'avax',
  'avalabs': 'avax',
  'stellar': 'xlm',
  'cardanofoundation': 'ada',
  'vechain': 'vet',
  'horizen': 'zen',

  // Stablecoins & Bridges
  'wormhole': 'w',       // may not exist

  // These use the CoinGecko coin image URL pattern instead
  // https://assets.coingecko.com/coins/images/{id}/small/{slug}.png
};

// For protocols not in the icon pack, use CoinGecko's static assets
// CoinGecko coin images are at: https://assets.coingecko.com/coins/images/{numeric_id}/small/{name}.png
// We'll use a different CDN pattern that works without API auth
const COINGECKO_LOGOS = {
  'synthetix': 'https://assets.coingecko.com/coins/images/3406/small/SNX.png',
  'yearnfinance': 'https://assets.coingecko.com/coins/images/11849/small/yfi-192x192.png',
  'sushiswap': 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
  'thorchain': 'https://assets.coingecko.com/coins/images/6595/small/Rune200x200.png',
  'pendle': 'https://assets.coingecko.com/coins/images/15069/small/Pendle_Logo_Normal-03.png',
  'morpho': 'https://assets.coingecko.com/coins/images/29837/small/Morpho-Token.png',
  'dodo': 'https://assets.coingecko.com/coins/images/12651/small/dodo_logo.png',
  'moonwell': 'https://assets.coingecko.com/coins/images/26326/small/WELL.png',
  'velodromefinance': 'https://assets.coingecko.com/coins/images/25783/small/velo.png',
  'radiant': 'https://assets.coingecko.com/coins/images/26536/small/Radiant-Logo-200x200.png',
  'sommelier': 'https://assets.coingecko.com/coins/images/23227/small/somm_new.png',
  'gainsnetwork': 'https://assets.coingecko.com/coins/images/19737/small/logo.png',
  'connext': 'https://assets.coingecko.com/coins/images/31137/small/next.png',
  'debridge': 'https://assets.coingecko.com/coins/images/34508/small/dbr.png',
  'pythnetwork': 'https://assets.coingecko.com/coins/images/31924/small/pyth.png',
  'exactly': 'https://assets.coingecko.com/coins/images/31156/small/exa.png',
  'superform': 'https://assets.coingecko.com/coins/images/34819/small/superform.png',
  'kwenta': 'https://assets.coingecko.com/coins/images/25729/small/kwenta.png',
  'synfutures': 'https://assets.coingecko.com/coins/images/36052/small/f.png',
  'lyra': 'https://assets.coingecko.com/coins/images/21490/small/lyra.png',
  'indexcoop': 'https://assets.coingecko.com/coins/images/12729/small/index.png',
  'beefyfinance': 'https://assets.coingecko.com/coins/images/12704/small/bifi.png',
  'woofi': 'https://assets.coingecko.com/coins/images/12921/small/WOO_Logos.png',
  'traderjoe': 'https://assets.coingecko.com/coins/images/17569/small/JoeToken.png',
  'hashflow': 'https://assets.coingecko.com/coins/images/26136/small/hashflow-icon-cmc.png',
  'galagames': 'https://assets.coingecko.com/coins/images/12493/small/GALA_token_image.png',
  'goldfinch': 'https://assets.coingecko.com/coins/images/19081/small/GFI.png',
  'dhedge': 'https://assets.coingecko.com/coins/images/12508/small/dHEDGE.png',
  'badger': 'https://assets.coingecko.com/coins/images/13287/small/badger_dao_logo.jpg',
  'tokemak': 'https://assets.coingecko.com/coins/images/17495/small/tokemak-avatar-200px-black.png',
  'forta': 'https://assets.coingecko.com/coins/images/25060/small/forta.png',
  'biconomy': 'https://assets.coingecko.com/coins/images/21061/small/biconomy_logo.jpg',
  'dforce': 'https://assets.coingecko.com/coins/images/9709/small/xlGxxIjI_400x400.jpg',
  'superfluid': 'https://assets.coingecko.com/coins/images/34651/small/superfluid.png',
  'swell': 'https://assets.coingecko.com/coins/images/34724/small/swell.png',
  'ipor': 'https://assets.coingecko.com/coins/images/28642/small/ipor_logo.png',
  'kelp-dao': 'https://assets.coingecko.com/coins/images/34783/small/kelp_dao.png',
  'pooltogether': 'https://assets.coingecko.com/coins/images/14003/small/PoolTogether.png',
  'illuvium': 'https://assets.coingecko.com/coins/images/14468/small/ILV.JPG',
  'injective': 'https://assets.coingecko.com/coins/images/12882/small/Secondary_Symbol.png',
  'gearbox': 'https://assets.coingecko.com/coins/images/22979/small/gearbox.png',
  'nexusmutual': 'https://assets.coingecko.com/coins/images/11810/small/NXMmain.png',
  // L2/Infrastructure
  'arbitrum': 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
  'optimism': 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
  'starknet': 'https://assets.coingecko.com/coins/images/26667/small/starknet.png',
  'polygon': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  'lido': 'https://assets.coingecko.com/coins/images/18523/small/ldo.png',
  'eigenlayer': 'https://assets.coingecko.com/coins/images/37087/small/eigenlayer.png',
  'avalanche': 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  'scroll': 'https://assets.coingecko.com/coins/images/34093/small/scroll.png',
  'sei': 'https://assets.coingecko.com/coins/images/28205/small/Sei_Logo.png',
  'linea': 'https://assets.coingecko.com/coins/images/37105/small/linea.png',
  'berachain': 'https://assets.coingecko.com/coins/images/34476/small/berachain.png',
  // Bridges
  'wormhole': 'https://assets.coingecko.com/coins/images/35087/small/wormhole_logo.png',
  // ENS
  'ens': 'https://assets.coingecko.com/coins/images/19785/small/acatxTm8_400x400.jpg',
  // Others
  'ethena': 'https://assets.coingecko.com/coins/images/36530/small/ethena.png',
  'gmx': 'https://assets.coingecko.com/coins/images/18323/small/arbit.png',
  'olympus': 'https://assets.coingecko.com/coins/images/14483/small/token_OHM_%281%29.png',
  'chainlink': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  'hyperlane': 'https://assets.coingecko.com/coins/images/37218/small/hyperlane.png',
  'sky': 'https://assets.coingecko.com/coins/images/39925/small/sky.png',
  'stargate': 'https://assets.coingecko.com/coins/images/24413/small/STG_LOGO.png',
  'aave': 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
  'reserve': 'https://assets.coingecko.com/coins/images/8365/small/rsr.png',
  'compoundfinance': 'https://assets.coingecko.com/coins/images/10775/small/COMP.png',
  'pancakeswap': 'https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo.png',
  'balancer': 'https://assets.coingecko.com/coins/images/11683/small/Balancer.png',
  'cowprotocol': 'https://assets.coingecko.com/coins/images/24384/small/cow.png',
  'decentraland': 'https://assets.coingecko.com/coins/images/878/small/decentraland-mana.png',
  'ankr': 'https://assets.coingecko.com/coins/images/4324/small/U85xTl2.png',
  'livepeer': 'https://assets.coingecko.com/coins/images/7137/small/livepeer.png',
  'thegraph': 'https://assets.coingecko.com/coins/images/13397/small/Graph_Token.png',
  'filecoin': 'https://assets.coingecko.com/coins/images/12817/small/filecoin.png',
  'stacks': 'https://assets.coingecko.com/coins/images/2069/small/Stacks_logo_full.png',
  'neo': 'https://assets.coingecko.com/coins/images/480/small/NEO_512_512.png',
  'vechain': 'https://assets.coingecko.com/coins/images/1167/small/VeChain-Logo-768x725.png',
  'horizen': 'https://assets.coingecko.com/coins/images/691/small/horizen.png',
  'stellar': 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png',
  'icon': 'https://assets.coingecko.com/coins/images/1060/small/icon-icx-logo.png',
  'raydium': 'https://assets.coingecko.com/coins/images/16871/small/img-raylogo.png',
  'obyte': 'https://assets.coingecko.com/coins/images/561/small/byteball.png',
  'solana': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  'synthetix': 'https://assets.coingecko.com/coins/images/3406/small/SNX.png',
  'yearnfinance': 'https://assets.coingecko.com/coins/images/11849/small/yfi-192x192.png',
  'sushiswap': 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
  'bonfida': 'https://assets.coingecko.com/coins/images/13395/small/bonfida.png',
  'galagames': 'https://assets.coingecko.com/coins/images/12493/small/GALA_token_image.png',
  // Additional protocols
  'alpacafinance': 'https://assets.coingecko.com/coins/images/14165/small/Logo200.png',
  'angleprotocol': 'https://assets.coingecko.com/coins/images/19060/small/ANGLE_Token-light.png',
  'carbonbancor': 'https://assets.coingecko.com/coins/images/736/small/bancor-bnt.png',
  'marinade': 'https://assets.coingecko.com/coins/images/18867/small/mnde.png',
  'mars': 'https://assets.coingecko.com/coins/images/24383/small/mars.png',
  'meanfinance': 'https://assets.coingecko.com/coins/images/21557/small/mean.png',
  'pushprotocol': 'https://assets.coingecko.com/coins/images/14769/small/push.png',
  'sovryn': 'https://assets.coingecko.com/coins/images/16248/small/sovryn.png',
  'driftprotocol': 'https://assets.coingecko.com/coins/images/28187/small/drift.png',
  'floki': 'https://assets.coingecko.com/coins/images/16746/small/FLOKI.png',
  'polkastarter': 'https://assets.coingecko.com/coins/images/12504/small/polkastarter.png',
  'perpetual': 'https://assets.coingecko.com/coins/images/15713/small/perp.png',
  'oceanprotocol': 'https://assets.coingecko.com/coins/images/3687/small/ocean-protocol-logo.jpg',
  'pstake': 'https://assets.coingecko.com/coins/images/23931/small/pSTAKE.png',
  'rubic': 'https://assets.coingecko.com/coins/images/12629/small/rubic.png',
  'spookyswap': 'https://assets.coingecko.com/coins/images/18662/small/boo.png',
  'tranchess': 'https://assets.coingecko.com/coins/images/16389/small/CHESS.png',
  'wombatexchange': 'https://assets.coingecko.com/coins/images/26089/small/wombat.png',
  'nodle': 'https://assets.coingecko.com/coins/images/27019/small/nodle.png',
  'polymesh': 'https://assets.coingecko.com/coins/images/23496/small/polymesh.png',
  'acala': 'https://assets.coingecko.com/coins/images/20634/small/aca.png',
  'astarnetwork': 'https://assets.coingecko.com/coins/images/22617/small/astar.png',
  'interlay': 'https://assets.coingecko.com/coins/images/26180/small/interlay.png',
  'moonbeamnetwork': 'https://assets.coingecko.com/coins/images/22459/small/glmr.png',
  'metis': 'https://assets.coingecko.com/coins/images/15595/small/metis.PNG',
  'nftx': 'https://assets.coingecko.com/coins/images/14025/small/NFTX_2022.png',
  'benddao': 'https://assets.coingecko.com/coins/images/26062/small/bend.png',
  'notional': 'https://assets.coingecko.com/coins/images/20082/small/note.png',
  'ribbon': 'https://assets.coingecko.com/coins/images/15823/small/RBN_64x64.png',
  'smardex': 'https://assets.coingecko.com/coins/images/29470/small/sdex.png',
  'spool': 'https://assets.coingecko.com/coins/images/21532/small/spool.png',
  'sturdy': 'https://assets.coingecko.com/coins/images/29250/small/sturdy.png',
  'thesandbox': 'https://assets.coingecko.com/coins/images/12129/small/sandbox_logo.jpg',
  'coreum': 'https://assets.coingecko.com/coins/images/29600/small/coreum.png',
  'flarenetwork': 'https://assets.coingecko.com/coins/images/28624/small/FLR-icon200x200.png',
  'neutron': 'https://assets.coingecko.com/coins/images/29146/small/neutron.png',
  'kadena': 'https://assets.coingecko.com/coins/images/3693/small/Webp.net-resizeimage_%2822%29.png',
};

let updated = 0;
let skipped = 0;

const files = fs.readdirSync(PROTOCOLS_DIR).filter(f => f.endsWith('.json') && f !== '_index.json' && f !== 'protocol_template.json');

for (const file of files) {
  const slug = file.replace('.json', '');
  const filePath = path.join(PROTOCOLS_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Skip if already has a logo
  if (data.logo_url && data.logo_url !== null) {
    skipped++;
    continue;
  }

  // Check CoinGecko logos first (more reliable), then icon pack
  const cgLogo = COINGECKO_LOGOS[slug];
  if (cgLogo) {
    data.logo_url = cgLogo;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    updated++;
    continue;
  }
}

console.log(`Updated ${updated} protocols with CoinGecko logos`);
console.log(`Skipped ${skipped} (already had logos)`);

// Final count
let withLogo = 0;
let withoutLogo = 0;
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(PROTOCOLS_DIR, file), 'utf-8'));
  if (data.logo_url && data.logo_url !== null) withLogo++;
  else withoutLogo++;
}
console.log(`\nFinal: ${withLogo} with logos, ${withoutLogo} without (letter fallback)`);
