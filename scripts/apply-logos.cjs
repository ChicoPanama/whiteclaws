// Apply logo URLs to protocol JSON files
const fs = require('fs');
const path = require('path');

const PROTOCOLS_DIR = path.join(__dirname, '..', 'public', 'protocols');

// Logo mapping: slug -> logo URL (from Immunefi snapshot)
// Keys are lowercased file slugs
const LOGOS = {
  'layerzero': 'https://images.ctfassets.net/t3wqy70tc3bv/3UXQcPOIAaOkE2QBCasSKa/14893bedf55bdb191e4cf99a67203e85/LayerZero_logo.jpeg',
  'stargate': 'https://images.ctfassets.net/t3wqy70tc3bv/7LX3n66MkHEBIYLZtNzQTA/811af3d0f225034e794af65976ba5d19/Stargate_logo.png',
  'reserve': 'https://images.ctfassets.net/t3wqy70tc3bv/2N1kPNfWAcD0jloxOqF4Cf/6e27b7ac7afb4180a3ade1e9d17bc4d5/reserve__1_.png',
  'sky': 'https://images.ctfassets.net/t3wqy70tc3bv/29CWfnhFWZUDZ0w83H0wj6/30bb70512c04338d29bd3bd5a261ad2c/Sky_Ecosystem.png',
  'usdt0': 'https://images.ctfassets.net/t3wqy70tc3bv/4qpRnmuoUMcdOxUOuFQUeN/278e2ad4821b6e2dadf60d84e3a4bb4f/USDT0.png',
  'sparklend': 'https://images.ctfassets.net/t3wqy70tc3bv/6PSQWUew0V3et86JKkvxs0/152af27a6fa55003a4cc5511f0641d17/badge__1_.png',
  'wormhole': 'https://images.ctfassets.net/t3wqy70tc3bv/zjpjBpSpX6wiIdgfoLeKc/b7c1a836bbc7a4a850623ddee15f3158/wormhole-logo-full-color-rgb-2000px_72ppi__1_.png',
  'gmx': 'https://images.ctfassets.net/t3wqy70tc3bv/3MNDLo0J4LVTW2PgGVCsrb/1b8813ff88a37704386e3c81237dfbbc/GMX_logo.jpeg',
  'olympus': 'https://images.ctfassets.net/t3wqy70tc3bv/7csKh5iZlfBPWyb3cJUY5h/1b7fd615e0a6edce69010e2913edbef6/final_logo_01_07_22_OLYMPUS.png',
  'ethena': 'https://images.ctfassets.net/t3wqy70tc3bv/2SCfByxtr2f7bf1Z8Vefzb/cea115652062b3f56441d4d63702fe22/download_copy.png',
  'chainlink': 'https://images.ctfassets.net/t3wqy70tc3bv/2NbXmUd05dVTI4CddDDFEK/62bc8a522d1b1bf77183097a87ee45d7/1200px-Chainlink_Logo__1_.png',
  'hyperlane': 'https://images.ctfassets.net/t3wqy70tc3bv/32dUEjoP7WozWkfwxWEhK2/92b2a5020a729f64f689dfa47af55717/Hyperlane_logo.jpeg',
  'zksync': 'https://images.ctfassets.net/t3wqy70tc3bv/BVBU3VYmZ7reZRrExTrGp/ba2e745ef785db7f3bae88ea8ba8523f/ZKTokenBlack.png',
  'axelarnetwork': 'https://images.ctfassets.net/t3wqy70tc3bv/50nSUkPKWY77vhNfAtPIXc/4200a486fe40455e51f74d3bd242d735/Axelar_Logo_Symbol_Black_3x.png',
  'optimism': 'https://images.ctfassets.net/t3wqy70tc3bv/iGySa7GVnISWqfSbIR9N4/2867df922f76c0f722543bdddd6e080b/Optimism_Logo.jpeg',
  'rhinofi': 'https://images.ctfassets.net/t3wqy70tc3bv/25ePrKVjMVEAkF7o1FWQYk/ca279ddf668dfa794424e918034346a5/rhino.fi_logo.jpeg',
  'eigenlayer': 'https://images.ctfassets.net/t3wqy70tc3bv/1fGXCRkOEb10n2rbNzZuEx/e1a710a7a3af9141424011913bbc58be/Eigenlayer_logo.jpeg',
  'sweateconomy': 'https://images.ctfassets.net/t3wqy70tc3bv/4cIP56xUCfhgaqmMzDeCMD/03d7201e7ff61ab8816864799a459338/SWEAT_CIRCLE_LOGO.png',
  'gnosischain': 'https://images.ctfassets.net/t3wqy70tc3bv/6ibSou9KOCjwRMOviQ4op0/76c3c2bda63a9c0c8c8432d71f234f8c/Aatar_green_white.png',
  'celer': 'https://images.ctfassets.net/t3wqy70tc3bv/13hITYqQMxBrQvjeOzbRhl/b7ca8569a07d3a2212aeac6a92244110/Celer_Logo.jpeg',
  'arbitrum': 'https://images.ctfassets.net/t3wqy70tc3bv/4R1H4ktLiQcp601gnixkJa/20dc4d9cf5229ae712f1413d9afced4f/Arbitrum.jpeg',
  'lido': 'https://images.ctfassets.net/t3wqy70tc3bv/62hsATkPdR14taAS7FTlXW/2b3efcb09394982db6e67d0b028a271c/G2czctJJ_400x400.png',
  'kamino': 'https://images.ctfassets.net/t3wqy70tc3bv/5ihJVSKL2zDj7D7tTDzXBA/b293116bce7222a8cdbe0d2b03295a09/8bUg0jRH_400x400.png',
  'zksyncera': 'https://images.ctfassets.net/t3wqy70tc3bv/5C91MGheTJXJfhYXd7Jjry/89c1af83fcb8de564462eb5e0e727012/era-arrows-white__1_.png',
  'beanstalk': 'https://images.ctfassets.net/t3wqy70tc3bv/3H8XDjXYI9JfMPAHZRNEGw/0652faecfc8a425182a7567cc93f00e5/Beanstalk_logo.jpeg',
  'capyfi': 'https://images.ctfassets.net/t3wqy70tc3bv/1EIJT2Cc6oawRdQQHlTt8B/f2a45dceb673a4b14c2f4f05dcf6e8d9/CapyFi.png',
  'immutable': 'https://images.ctfassets.net/t3wqy70tc3bv/4jyESr3DuPBvV84CVG2sL1/4a66b3f802b2aa1117a34981a098921b/immutable.png',
  'compoundfinance': 'https://images.ctfassets.net/t3wqy70tc3bv/5pzaBv2Ygrx3DN9sctxd0a/dcb98ece577d2c0ac8b6ea637e9a3069/Compound.png',
  'kiln-on-chain-v1': 'https://images.ctfassets.net/t3wqy70tc3bv/1SEs1ui9Ficgtj8iEcEZKG/204a23e8cfb04126d1a48548947cb448/Kiln_Defi.png',
  'eclipse': 'https://images.ctfassets.net/t3wqy70tc3bv/2mMhoo9TBjTkWTi4DMXodI/160835f9ff29fc0d7d43c354a1dab4a1/Eclipse.png',
  '0x': 'https://images.ctfassets.net/t3wqy70tc3bv/lyQiC5BZ6cB4x9bgGUFPi/dd8c99b13df7edf308ca678c0607ee48/dlhDYt89_400x400.png',
  'infinex': 'https://images.ctfassets.net/t3wqy70tc3bv/4REZQLdbs6K0irbIotWWrJ/2e9701b46b3e8119ddb1e2cf3bb0370c/Zkzg4kfY_400x400.png',
  'polymarket': 'https://images.ctfassets.net/t3wqy70tc3bv/5jxAOPTfTYMoswZPI9Mn9N/ffb11e8d127bd24a1aec560645af8f51/photo_2024-04-22_20.07.26__1_.png',
  'aave': 'https://images.ctfassets.net/t3wqy70tc3bv/5nVG9oUSZ05hb2dlIuqPU6/5d6e4c5db151fdd8fb48448990056e05/Screenshot_2024-08-12_at_5.37.45___PM.png',
  'scroll': 'https://images.ctfassets.net/t3wqy70tc3bv/IzdR0T8CiuGHqOpDEOGaJ/dadd27860fb4f34caa41477494233b28/Fq5O0LeN_400x400.jpg',
  'ssv-network': 'https://images.ctfassets.net/t3wqy70tc3bv/66mTctNPGQxwpoc8NxKOzc/db72f4f7f79f09e6b26198097ee59b76/ssv.png',
  'staderforeth': 'https://images.ctfassets.net/t3wqy70tc3bv/1iQDInT514hzL2832OmJSQ/81275804e386d69c44048a90c690eecb/j-TUyZEq_400x400.jpg',
  'starkex': 'https://images.ctfassets.net/t3wqy70tc3bv/6t4qbnsCLpWXBvsPoQ5s2g/17cf9df21e075276f7522e2ca3c67e9c/StarkEx-symbol.png',
  'ondofinance': 'https://images.ctfassets.net/t3wqy70tc3bv/2dR2c08kamplNaWIiF37h6/c269496e763806bbbd815efa7c662590/ondo-logo.svg',
  'bobanetwork': 'https://images.ctfassets.net/t3wqy70tc3bv/2wV1YzHxDN4EUqz1RJuw6E/a8d877797715ffa2e502bd56e411899b/Boba_Network_logo.jpeg',
  'starknet': 'https://images.ctfassets.net/t3wqy70tc3bv/4ZifqdIHOxX3ckxGAMiQc6/4158480f9932b5fe099a1236902cd588/starknet.png',
  'aurafinance': 'https://images.ctfassets.net/t3wqy70tc3bv/5K5gW86YPxCmDeFWSeD5fi/f83f639d8527d85e7243e4e4331aa2ed/Aura_Finance_logo.jpeg',
  'listadao': 'https://images.ctfassets.net/t3wqy70tc3bv/5aOBSUu0V6jW0Op03W4NDF/beec6ccbe2927310dffb147f24fdb902/Twitter_profile_400x400.png',
  'balancer': 'https://images.ctfassets.net/t3wqy70tc3bv/5RONBs8MvUillmn49FRQ8G/58ec9b1dcf5079426bebf218c3948166/Balancer_Logo.png',
  'flamingofinance': 'https://images.ctfassets.net/t3wqy70tc3bv/2F4VGKaboWEaBfj1yfdpj/5597728d3c7bbd22b3814cb79d71ccde/Flamingo_Finance_logo.jpeg',
  'origin-protocol': 'https://images.ctfassets.net/t3wqy70tc3bv/V5uJkzVDim5cy4syFWXHn/081f82c419fd83a700d15a8c80e46eb6/ognresized.png',
  'polygon': 'https://images.ctfassets.net/t3wqy70tc3bv/8EEzTabH4B0Palx5UgpL8/4d800cd963e02d33e39872b4030e7e2f/Polygon__1_.jpeg',
  'cowprotocol': 'https://images.ctfassets.net/t3wqy70tc3bv/2SCCBIzc5z3ZxUhwhW1NSK/c6616b0b6f3bbacfebd5a6ea18f929dd/CoW-Protocol-icon-circle-light-purple.png',
  'pancakeswap': 'https://images.ctfassets.net/t3wqy70tc3bv/2xJOw4FpKeRGxyQOV0RG0G/58c413a9b3969ddbd605bea881c02e72/Pancakeswap-logo.jpg',
  'fluxfinance': 'https://images.ctfassets.net/t3wqy70tc3bv/4aokvelvaJE4fFquv6ScJb/7533cb65195c3bb2c9707a314aba7776/2023-02-07_08_Small.png',
  'raydium': 'https://images.ctfassets.net/t3wqy70tc3bv/4X5hbah3bOvGiEZIPrFmeW/30eb4e2d5a47c3eca8d10b3fcff3ee7c/Raydium_logo.jpeg',
  'paradex': 'https://images.ctfassets.net/t3wqy70tc3bv/2jxO6gDlNVXPLn4MT1JLtQ/fd3d05358610c2b50b679fa2812fe9f6/EnotVJl3_400x400.png',
  'injective': 'https://images.ctfassets.net/t3wqy70tc3bv/YMAl62N6W7pJGRcRDyIYw/8a855775c397fed4fb89ddfee5cd84b8/injective.png',
  'resolv': 'https://images.ctfassets.net/t3wqy70tc3bv/PVFDul5ntVzCg90oXYIWi/5ccd470c276900e19c507f93174d4eb0/1gDrgTdA_400x400.png',
  'symbiotic': 'https://images.ctfassets.net/t3wqy70tc3bv/3JOu1jGRL3ble8qzc1DwcS/cc699f3aea75cafc031a7fa283606620/symbiotic.png',
  'nucleus': 'https://images.ctfassets.net/t3wqy70tc3bv/2qCwSDuVU4ePltEqcJE5cc/73041be9b5fc4d3993c94d4574dcfb93/Nucleus.png',
  'kiln-defi': 'https://images.ctfassets.net/t3wqy70tc3bv/2rN68srCOESswyxdwjzdRM/90ac006b52d632dc6f51d60ea3122922/Kiln_Defi.png',
  'firedancer': 'https://images.ctfassets.net/t3wqy70tc3bv/2O0QVg3wfx8rp3u3rzgqUg/4df69f867867b9c6b65a0cc30533e0b4/Firedancer_Transparent.png',
  'babylon-labs': 'https://images.ctfassets.net/t3wqy70tc3bv/5ZuVO0D8rx9fzSoB5UVsx4/e5f38f1b93be6cb32b6255c21f6db81c/NEW_Babylon_Labs.png',
  'dexeprotocol': 'https://images.ctfassets.net/t3wqy70tc3bv/5ZQ0i4NAKMQyO19x7Z65k8/257b06a35dfa48dcdb2ec16351267695/71133570.png',
  'renzoprotocol': 'https://images.ctfassets.net/t3wqy70tc3bv/5vS0LqsY8aTwXw4AXCjNrB/3a1542886af81a0885485f9187ecb693/2.0_Renzo_Black_Logo__1_.png',
  'sei': 'https://images.ctfassets.net/t3wqy70tc3bv/1lOFdVmQG8KNmJhGtr8lhs/40400407c90b0736a8e506b081b70887/Sei_Labs_Logo.png',
  'meth': 'https://images.ctfassets.net/t3wqy70tc3bv/5TuHbYiYuIs9pkt4uXgpYi/e3de325d4dccda8d68e8a4cc61e95050/mantle.png',
  'aera': 'https://qn5bmgziiocgawpp.public.blob.vercel-storage.com/68079-n9d0rNJbDR1UhZrk5PB-8-drmxDRKWuwD1uXuimpkrn5Bgau0swQ.png',
  'perennial': 'https://images.ctfassets.net/t3wqy70tc3bv/4ycrPoQ936fnEBbl69XK77/824a5bb3ea88e9ebcb7a2b0bd01e746c/perennial_logo.jpeg',
  'kiln': 'https://images.ctfassets.net/t3wqy70tc3bv/2iDDxMXgRnP06wYCjb4T3E/5c65c546efd0c74e47ac0db66e773bb5/Kiln_Defi.png',
  'utix': 'https://images.ctfassets.net/t3wqy70tc3bv/11JCYUuvvCgVwDyzMmDklA/79a4bfd3682951f96d5ca851f6d9abdb/10_copy.png',
  'thresholdnetwork': 'https://images.ctfassets.net/t3wqy70tc3bv/5sXJAYkgjf0BtH2uarlVA3/1f1993cf792814921c5c289b57004768/token-symbol-purple.svg',
  'hydration': 'https://images.ctfassets.net/t3wqy70tc3bv/3lm40Mobfxo3pFJkKBXPuc/b12c4e4926c6c5185a9b2a0ce7ae106a/Hydration.png',
  'ankr': 'https://images.ctfassets.net/t3wqy70tc3bv/3LohZrbHuhcG4MgU2zrH4A/39bca0e7dc6e249cee3706c8c0021929/Ankr_logo.jpeg',
  'decentraland': 'https://images.ctfassets.net/t3wqy70tc3bv/CXsZzmFYIOc6VRsmn4i4P/aa9602446e06cec6320bbab0f437ea98/decentraland-mana-logo_copy.png',
  'bifrostfinance': 'https://images.ctfassets.net/t3wqy70tc3bv/1tNOIPGrvNlWWhK1FBWj8w/c7bc0dad9e9b986ff06d577092790508/Bifrost_logo.jpeg',
  'orca': 'https://images.ctfassets.net/t3wqy70tc3bv/6p07t55yWuOlsHLiQV9xsM/61c489fc59e7233557039a6965c76000/Screenshot_2024-11-11_at_11.35.18___PM.png',
  'maple': 'https://images.ctfassets.net/t3wqy70tc3bv/eUOQ1h8f4Rp7j6crz0YSq/669fab983d425d27fad87560219065a5/Maple_Logo.jpg',
  'buttonwood': 'https://images.ctfassets.net/t3wqy70tc3bv/4KQLVXSS65vjjJRtqM1PbQ/85eeab1addc2bdf186d9f37032c21fe2/logo__black___1_.png',
  'sherlock': 'https://images.ctfassets.net/t3wqy70tc3bv/7aux7xm6bBE32KgmsF1XGi/db78d0f1bdfc7b2f47b41a7b5b2aa7df/Screenshot_2024-11-15_at_1.16.08___AM.png',
  'instadapp': 'https://images.ctfassets.net/t3wqy70tc3bv/7jHZEinQjaABm48Sct1BZs/3d224c5a05bff575e14b98970f939667/Instadapp.jpeg',
  'rocketpool': 'https://images.ctfassets.net/t3wqy70tc3bv/3q1XTgKfkqJW9nCVPRp7r5/8afa695989d14412d92dc2e26d4c1a47/Rocket_Pool__1_.jpeg',
  'benqi': 'https://qn5bmgziiocgawpp.public.blob.vercel-storage.com/14300-nU4DSeZAHougwVPw4q-SQ-Wooj2YwSfUcpv5Msnb6tyrMGQU4XKm.png',
  'alphaventuredao': 'https://images.ctfassets.net/t3wqy70tc3bv/71pklpx3jRf9XgK7fxlT8n/c7c77d4bcca1ee5dd85284c4c1f95c01/Alphafinance-logo.png',
  'silofinance-v2': 'https://images.ctfassets.net/t3wqy70tc3bv/24De5VCsfH9jV4NpjRiQ6W/244ff375931983ac032a372d5e399906/Screenshot_2024-11-15_at_12.54.01___AM.png',
  'defisaver': 'https://images.ctfassets.net/t3wqy70tc3bv/1S8ggfDmWMZTN2T6wcMNaS/b56ce9699295511536c8e970e550ee9c/Defisaver-logo.jpg',
  'stakestone': 'https://images.ctfassets.net/t3wqy70tc3bv/lTWhtXDyfizGgVkU5Myjr/f2b9c05def378a446671efd050d90389/StakeStone.png',
  'etherfi': 'https://images.ctfassets.net/t3wqy70tc3bv/6uARdqsJxpv7UY78Xbg27/bce4b93c8e971a1a55315d80310f1b9f/ether_fi1677585111698.png',
  'alchemix': 'https://images.ctfassets.net/t3wqy70tc3bv/2NgcBC2slhGYI8qYGnTsCw/0616521e1a588b3a5373af0215dd2a2b/Alchemix-logo.png',
  'aevo': 'https://images.ctfassets.net/t3wqy70tc3bv/1ORcP6RE6HcGhV4bTAv8AN/8ce035bee832701401c4576fda63117c/Ribbon-logo.svg',
  'parallel': 'https://images.ctfassets.net/t3wqy70tc3bv/2cR3OuUeSXBHqSGDcezrsX/90bffee28924be018f95fac32470840b/Parallel_Protocol.png',
};

let updated = 0;
let alreadyHad = 0;

const files = fs.readdirSync(PROTOCOLS_DIR).filter(f => f.endsWith('.json') && f !== '_index.json' && f !== 'protocol_template.json');

for (const file of files) {
  const slug = file.replace('.json', '');
  const logoUrl = LOGOS[slug];

  if (!logoUrl) continue;

  const filePath = path.join(PROTOCOLS_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (data.logo_url && data.logo_url !== null) {
    alreadyHad++;
    continue;
  }

  data.logo_url = logoUrl;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  updated++;
}

console.log(`Updated ${updated} protocols with logos`);
console.log(`${alreadyHad} already had logos`);

// Count remaining nulls
let nullCount = 0;
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(PROTOCOLS_DIR, file), 'utf-8'));
  if (!data.logo_url || data.logo_url === null) nullCount++;
}
console.log(`${nullCount} protocols still missing logos (will use letter fallback)`);
console.log(`${files.length - nullCount} protocols now have logos`);
