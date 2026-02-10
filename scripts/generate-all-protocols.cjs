// Generate all missing protocol JSON files from Immunefi snapshot data
// This script is meant to be run once to populate the protocols directory.

const fs = require('fs');
const path = require('path');

const PROTOCOLS_DIR = path.join(__dirname, '..', 'public', 'protocols');

// Full list of Immunefi projects from the GitHub snapshot
const ALL_SLUGS = [
  '0x','88mphv3','Aevo','AlphaVentureDAO','StaderforPolygon','aave','acala','aera','alchemix','aleo',
  'alephzero','alex','aloeprotocol','alongside','alpacafinance','alpen-labs','ambire','angleprotocol',
  'ankr','antefinance','anvil','apecoinmainnet','arbitrum','arborfinance','arcade','arkadiko','arkham',
  'aspida','astarnetwork','aster','astroport','aurafinance','autonolas','avail','avalabs','avalanche',
  'axelarnetwork','axiom','baanx','babylon-labs','badger','balancer','balmy','bankx','baofinance',
  'basilisk','beanstalk','beefyfinance','beethovenx','beets','benddao','benqi','berachain-webapps',
  'berachain','beradrome','betafinance','biconomy','bifi','bifrostfinance','bitcoinsv','bitflow',
  'bitswift','blackwing','blockpinetwork','blockwallet','bobanetwork','bondprotocol','bonfida',
  'bprotocol','burrow','buttonwood','c3','capyfi','carbonbancor','cardanofoundation','celer','ceres',
  'chainlink','charm','comdex','composablefinance','compoundfinance','connext','contrax','coreum',
  'cove','cowprotocol','cyan','daimo-pay','daimo','darwinia','davos','debridge','decentraland',
  'defisaver','defly','degate','delv','deriprotocol','dexeprotocol','dforce','dfxfinance','dhedge',
  'dodo','dodov3','driftprotocol','drips','duetfinance','ebtc','eckodao','eclipse','eco','econia',
  'eigenlayer','elixirprotocol','enosys','ens','ensuro','enzyme-onyx','enzymefinance','ethena',
  'etherfi','euphrates','exactly','exodus','extrafinance','farcaster','fassets','fbtc','felix',
  'filecoin','firedancer','flamingofinance','flarenetwork','flexytech','floki','fluxfinance','foil',
  'folksfinance','forta','foundation','furucombo','furucombofunds','gainsnetwork','galagames','gamma',
  'gammaswap','gear','gearbox','geniusyield','gerowallet','ghostmarket','glodollar','gmx','gnosischain',
  'gogopool','goldfinch','granite-protocol','gysr','hakkafinance','harvest','hashflow','hathornetwork',
  'haven1','hedera','hibachi','horizen','hourglass','hydradx','hydration','hydro','hyperlane','ichi',
  'icon','idex','idlefinance','illuvium','immunefi','immutable','impossible-cloud-network',
  'impossiblefinance','indexcoop','infinex','injective','instadapp','integral','integriteenetwork',
  'interlay','intmax','inversefinance','ion-protocol','ipor','jito-bam-client','jito-foundation',
  'jito','justlenddao','kadena','kamino','keep3rnetwork','kelp-dao','kiln-defi','kiln-on-chain-v1',
  'kiln-webapp','kiln','kinesis-bridge-on-kadena','kwenta','landx','layerzero','lendr','lido',
  'lidoonpolygon','lifi','light-protocol','linea','liquidswap','listadao','livepeer','localtraders',
  'lombard-finance','lossless','lybrafinance','lyra','mETH','magpiexyz','makerdao','mantlelsp',
  'maple','marinade','mars','marsecosystem','mayaprotocol','meanfinance','metalswap',
  'metastreet-yield-pass','metastreet','metis','metronome','monero-oxide','moneyonchain',
  'moonbeamnetwork','moonwell','morpho','mountainprotocol','mtpelerin','mux','myntandzero','native',
  'nayms','neo','neutron','nexusmutual','nftfi','nftfitestnetrefi','nftx','nodle','nomad','notional',
  'nucleus','oasis','obyte','oceanprotocol','octopusnetwork','ofza-1','olafinance','olympus',
  'omni-network','omron','ondofinance','openzeppelin-stellar','openzeppelin','optimism','opyngamma',
  'opynsqueeth','orca','orderlynetwork','origindefi','originprotocol','ostium','overlay','pact',
  'pancakeswap','pantos','paradex','paragonsdao','parallel','parallelwallet','pareto','paribus',
  'pendle','perennial','perpetual','pikaprotocol','pillar','pinto','pnetwork','pods','polkastarter',
  'polygon','polygonzkevm','polymarket','polymesh','poolshark','pooltogether','popsicle','portfinance',
  'pragmaoracle','predyfinance','primitive','print3r','pstake','pstakeoncosmos','pushprotocol',
  'pythnetwork','qblockchain','quadrata','radiant','rai','rangeprotocol','raydium','reaperfarm',
  'reffinance','renzoprotocol','reserve','resolv','resonate','revert','revest','rhinofi','ribbon',
  'ringdao','rocketpool','router','royco','rubic','ruscet','rysk','scroll','sectorfinance',
  'securefi','segmentfinance','sei','serai','shellprotocol','sherlock','silofinance-v2','silofinance',
  'singularitydao','skatefi','sky','smardex','sns','sommelier','sora','sovryn','sparklend',
  'spectral','spookyswap','spool','spot','ssvnetwork','stackingdao','stacks','staderforbnb',
  'staderforeth','stafi','stakeeasy','stakelink','stakestone','stakewise','stargate','starkex',
  'starknet-staking','starknet','stellar','stellaswap','strikefinance','sturdy','summerfi',
  'superbots','superfluid','superform','sushiswap','swappi','sweateconomy','swell','symbiosis',
  'symbiotic','synfutures','synthetix','teahousefinance','templar-protocol','termstructurelabs',
  'tetu','thala-protocol','thegraph','thesandbox','thorchain','thresholdnetwork','thusd','tidal',
  'timelessandbunni','tinyman','tinymanv2','tokemak','toucan','traderjoe','tranchess','tropykus',
  'trufin','uniswaponzksync','universalpage','unstoppablewallet','usdn','usdt0','usx','utix',
  'vaultcraft','vechain','velodromefinance','velvet-capital-v2','velvetcapital','vesper','vesu',
  'virtuals-protocol','voltz','waymont','wepiggy','wildcatprotocol','wombatexchange','woofi',
  'wormhole','xion','xoxno','xterio','yamatoprotocol','yearnfinance','yelay','yieldnest',
  'yo-protocol','zano','zenlink','zerion','zerolend','zestprotocol','zksync-os','zksync','zksyncera',
  'zkverify','zodiac'
];

// Known data from Immunefi (name, maxBounty, category, logoUrl, chains)
const KNOWN_DATA = {
  'layerzero': { name: 'LayerZero', max: 15000000, cat: 'Bridge', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/3UXQcPOIAaOkE2QBCasSKa/14893bedf55bdb191e4cf99a67203e85/LayerZero_logo.jpeg', chains: ['ethereum','arbitrum','optimism','polygon','bsc','base'] },
  'stargate': { name: 'Stargate', max: 10000000, cat: 'Bridge', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/7LX3n66MkHEBIYLZtNzQTA/811af3d0f225034e794af65976ba5d19/Stargate_logo.png', chains: ['ethereum','arbitrum','optimism','polygon','bsc'] },
  'reserve': { name: 'Reserve', max: 10000000, cat: 'DeFi Stablecoin', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2N1kPNfWAcD0jloxOqF4Cf/6e27b7ac7afb4180a3ade1e9d17bc4d5/reserve__1_.png', chains: ['ethereum','base'] },
  'sky': { name: 'Sky', max: 10000000, cat: 'DeFi Stablecoin', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/29CWfnhFWZUDZ0w83H0wj6/30bb70512c04338d29bd3bd5a261ad2c/Sky_Ecosystem.png', chains: ['ethereum'] },
  'usdt0': { name: 'USDT0', max: 6000000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/4qpRnmuoUMcdOxUOuFQUeN/278e2ad4821b6e2dadf60d84e3a4bb4f/USDT0.png', chains: ['ethereum'] },
  'sparklend': { name: 'Spark', max: 5000000, cat: 'DeFi Lending', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/6PSQWUew0V3et86JKkvxs0/152af27a6fa55003a4cc5511f0641d17/badge__1_.png', chains: ['ethereum'] },
  'wormhole': { name: 'Wormhole', max: 5000000, cat: 'Bridge', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/zjpjBpSpX6wiIdgfoLeKc/b7c1a836bbc7a4a850623ddee15f3158/wormhole-logo-full-color-rgb-2000px_72ppi__1_.png', chains: ['ethereum','solana','bsc','polygon','arbitrum'] },
  'gmx': { name: 'GMX', max: 5000000, cat: 'DeFi Trading', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/3MNDLo0J4LVTW2PgGVCsrb/1b8813ff88a37704386e3c81237dfbbc/GMX_logo.jpeg', chains: ['arbitrum','avalanche'] },
  'olympus': { name: 'Olympus', max: 3333333, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/7csKh5iZlfBPWyb3cJUY5h/1b7fd615e0a6edce69010e2913edbef6/final_logo_01_07_22_OLYMPUS.png', chains: ['ethereum','arbitrum','optimism'] },
  'ethena': { name: 'Ethena', max: 3000000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2SCfByxtr2f7bf1Z8Vefzb/cea115652062b3f56441d4d63702fe22/download_copy.png', chains: ['ethereum'] },
  'chainlink': { name: 'Chainlink', max: 3000000, cat: 'Infrastructure', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2NbXmUd05dVTI4CddDDFEK/62bc8a522d1b1bf77183097a87ee45d7/1200px-Chainlink_Logo__1_.png', chains: ['ethereum','arbitrum','optimism','polygon','bsc','base'] },
  'hyperlane': { name: 'Hyperlane', max: 2500000, cat: 'Bridge', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/32dUEjoP7WozWkfwxWEhK2/92b2a5020a729f64f689dfa47af55717/Hyperlane_logo.jpeg', chains: ['ethereum','arbitrum','optimism','polygon'] },
  'zksync': { name: 'ZKsync Lite', max: 2300000, cat: 'Layer 2', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/BVBU3VYmZ7reZRrExTrGp/ba2e745ef785db7f3bae88ea8ba8523f/ZKTokenBlack.png', chains: ['ethereum'] },
  'axelarnetwork': { name: 'Axelar Network', max: 2250000, cat: 'Bridge', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/50nSUkPKWY77vhNfAtPIXc/4200a486fe40455e51f74d3bd242d735/Axelar_Logo_Symbol_Black_3x.png', chains: ['ethereum','arbitrum','polygon','optimism','base'] },
  'optimism': { name: 'Optimism', max: 2000042, cat: 'Layer 2', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/iGySa7GVnISWqfSbIR9N4/2867df922f76c0f722543bdddd6e080b/Optimism_Logo.jpeg', chains: ['ethereum','optimism'] },
  'rhinofi': { name: 'Rhino.fi', max: 2000000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/25ePrKVjMVEAkF7o1FWQYk/ca279ddf668dfa794424e918034346a5/rhino.fi_logo.jpeg', chains: ['ethereum','arbitrum','optimism','polygon','bsc'] },
  'eigenlayer': { name: 'EigenLayer', max: 2000000, cat: 'DeFi Staking', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/1fGXCRkOEb10n2rbNzZuEx/e1a710a7a3af9141424011913bbc58be/Eigenlayer_logo.jpeg', chains: ['ethereum'] },
  'sweateconomy': { name: 'Sweat Economy', max: 2000000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/4cIP56xUCfhgaqmMzDeCMD/03d7201e7ff61ab8816864799a459338/SWEAT_CIRCLE_LOGO.png', chains: ['near'] },
  'gnosischain': { name: 'Gnosis Chain', max: 2000000, cat: 'L2 / L1', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/6ibSou9KOCjwRMOviQ4op0/76c3c2bda63a9c0c8c8432d71f234f8c/Aatar_green_white.png', chains: ['ethereum','bsc'] },
  'celer': { name: 'Celer', max: 2000000, cat: 'Bridge', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/13hITYqQMxBrQvjeOzbRhl/b7ca8569a07d3a2212aeac6a92244110/Celer_Logo.jpeg', chains: ['ethereum','arbitrum','bsc','optimism','polygon'] },
  'arbitrum': { name: 'Arbitrum', max: 2000000, cat: 'Layer 2', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/4R1H4ktLiQcp601gnixkJa/20dc4d9cf5229ae712f1413d9afced4f/Arbitrum.jpeg', chains: ['ethereum','arbitrum'] },
  'lido': { name: 'Lido', max: 2000000, cat: 'DeFi Staking', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/62hsATkPdR14taAS7FTlXW/2b3efcb09394982db6e67d0b028a271c/G2czctJJ_400x400.png', chains: ['ethereum'] },
  'kamino': { name: 'Kamino', max: 1500000, cat: 'DeFi Lending', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/5ihJVSKL2zDj7D7tTDzXBA/b293116bce7222a8cdbe0d2b03295a09/8bUg0jRH_400x400.png', chains: ['solana'] },
  'zksyncera': { name: 'ZKsync Era', max: 1100000, cat: 'Layer 2', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/5C91MGheTJXJfhYXd7Jjry/89c1af83fcb8de564462eb5e0e727012/era-arrows-white__1_.png', chains: ['ethereum'] },
  'beanstalk': { name: 'Beanstalk', max: 1100000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/3H8XDjXYI9JfMPAHZRNEGw/0652faecfc8a425182a7567cc93f00e5/Beanstalk_logo.jpeg', chains: ['ethereum'] },
  'capyfi': { name: 'CapyFi', max: 1000000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/1EIJT2Cc6oawRdQQHlTt8B/f2a45dceb673a4b14c2f4f05dcf6e8d9/CapyFi.png', chains: ['ethereum'] },
  'immutable': { name: 'Immutable', max: 1000000, cat: 'Gaming/NFT', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/4jyESr3DuPBvV84CVG2sL1/4a66b3f802b2aa1117a34981a098921b/immutable.png', chains: ['ethereum'] },
  'compoundfinance': { name: 'Compound Finance', max: 1000000, cat: 'DeFi Lending', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/5pzaBv2Ygrx3DN9sctxd0a/dcb98ece577d2c0ac8b6ea637e9a3069/Compound.png', chains: ['ethereum','arbitrum','base','polygon'] },
  'kiln-on-chain-v1': { name: 'Kiln On-Chain v1', max: 1000000, cat: 'DeFi Staking', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/1SEs1ui9Ficgtj8iEcEZKG/204a23e8cfb04126d1a48548947cb448/Kiln_Defi.png', chains: ['ethereum'] },
  'eclipse': { name: 'Eclipse', max: 1000000, cat: 'Infrastructure', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2mMhoo9TBjTkWTi4DMXodI/160835f9ff29fc0d7d43c354a1dab4a1/Eclipse.png', chains: ['solana','ethereum'] },
  '0x': { name: '0x', max: 1000000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/lyQiC5BZ6cB4x9bgGUFPi/dd8c99b13df7edf308ca678c0607ee48/dlhDYt89_400x400.png', chains: ['ethereum','polygon','arbitrum','base','optimism'] },
  'infinex': { name: 'Infinex', max: 1000000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/4REZQLdbs6K0irbIotWWrJ/2e9701b46b3e8119ddb1e2cf3bb0370c/Zkzg4kfY_400x400.png', chains: ['ethereum'] },
  'polymarket': { name: 'Polymarket', max: 1000000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/5jxAOPTfTYMoswZPI9Mn9N/ffb11e8d127bd24a1aec560645af8f51/photo_2024-04-22_20.07.26__1_.png', chains: ['polygon'] },
  'aave': { name: 'AAVE', max: 1000000, cat: 'DeFi Lending', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/5nVG9oUSZ05hb2dlIuqPU6/5d6e4c5db151fdd8fb48448990056e05/Screenshot_2024-08-12_at_5.37.45___PM.png', chains: ['ethereum','arbitrum','optimism','polygon','base'] },
  'scroll': { name: 'Scroll', max: 1000000, cat: 'Layer 2', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/IzdR0T8CiuGHqOpDEOGaJ/dadd27860fb4f34caa41477494233b28/Fq5O0LeN_400x400.jpg', chains: ['ethereum'] },
  'ssvnetwork': { name: 'SSV Network', max: 1000000, cat: 'DeFi Staking', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/66mTctNPGQxwpoc8NxKOzc/db72f4f7f79f09e6b26198097ee59b76/ssv.png', chains: ['ethereum'] },
  'staderforeth': { name: 'Stader for ETH', max: 1000000, cat: 'DeFi Staking', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/1iQDInT514hzL2832OmJSQ/81275804e386d69c44048a90c690eecb/j-TUyZEq_400x400.jpg', chains: ['ethereum'] },
  'starkex': { name: 'StarkEx', max: 1000000, cat: 'Layer 2', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/6t4qbnsCLpWXBvsPoQ5s2g/17cf9df21e075276f7522e2ca3c67e9c/StarkEx-symbol.png', chains: ['ethereum'] },
  'ondofinance': { name: 'Ondo Finance', max: 1000000, cat: 'RWA Tokenization', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2dR2c08kamplNaWIiF37h6/c269496e763806bbbd815efa7c662590/ondo-logo.svg', chains: ['ethereum'] },
  'bobanetwork': { name: 'Boba Network', max: 1000000, cat: 'Layer 2', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2wV1YzHxDN4EUqz1RJuw6E/a8d877797715ffa2e502bd56e411899b/Boba_Network_logo.jpeg', chains: ['ethereum','bsc'] },
  'starknet': { name: 'StarkNet', max: 1000000, cat: 'Layer 2', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/4ZifqdIHOxX3ckxGAMiQc6/4158480f9932b5fe099a1236902cd588/starknet.png', chains: ['ethereum'] },
  'aurafinance': { name: 'Aura Finance', max: 1000000, cat: 'DeFi Yield', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/5K5gW86YPxCmDeFWSeD5fi/f83f639d8527d85e7243e4e4331aa2ed/Aura_Finance_logo.jpeg', chains: ['ethereum'] },
  'listadao': { name: 'Lista DAO', max: 1000000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/5aOBSUu0V6jW0Op03W4NDF/beec6ccbe2927310dffb147f24fdb902/Twitter_profile_400x400.png', chains: ['bsc'] },
  'balancer': { name: 'Balancer', max: 1000000, cat: 'DEX', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/5RONBs8MvUillmn49FRQ8G/58ec9b1dcf5079426bebf218c3948166/Balancer_Logo.png', chains: ['ethereum','polygon'] },
  'flamingofinance': { name: 'Flamingo Finance', max: 1000000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2F4VGKaboWEaBfj1yfdpj/5597728d3c7bbd22b3814cb79d71ccde/Flamingo_Finance_logo.jpeg', chains: ['ethereum'] },
  'originprotocol': { name: 'Origin Protocol', max: 1000000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/V5uJkzVDim5cy4syFWXHn/081f82c419fd83a700d15a8c80e46eb6/ognresized.png', chains: ['ethereum'] },
  'polygon': { name: 'Polygon', max: 1000000, cat: 'Layer 2', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/8EEzTabH4B0Palx5UgpL8/4d800cd963e02d33e39872b4030e7e2f/Polygon__1_.jpeg', chains: ['ethereum','polygon'] },
  'cowprotocol': { name: 'CoW Protocol', max: 1000000, cat: 'DEX', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2SCCBIzc5z3ZxUhwhW1NSK/c6616b0b6f3bbacfebd5a6ea18f929dd/CoW-Protocol-icon-circle-light-purple.png', chains: ['ethereum'] },
  'pancakeswap': { name: 'PancakeSwap', max: 1000000, cat: 'DEX', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2xJOw4FpKeRGxyQOV0RG0G/58c413a9b3969ddbd605bea881c02e72/Pancakeswap-logo.jpg', chains: ['bsc','ethereum','arbitrum','base'] },
  'fluxfinance': { name: 'Flux Finance', max: 550000, cat: 'DeFi Lending', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/4aokvelvaJE4fFquv6ScJb/7533cb65195c3bb2c9707a314aba7776/2023-02-07_08_Small.png', chains: ['ethereum'] },
  'raydium': { name: 'Raydium', max: 505000, cat: 'DEX', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/4X5hbah3bOvGiEZIPrFmeW/30eb4e2d5a47c3eca8d10b3fcff3ee7c/Raydium_logo.jpeg', chains: ['solana'] },
  'paradex': { name: 'Paradex', max: 500000, cat: 'DeFi Trading', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2jxO6gDlNVXPLn4MT1JLtQ/fd3d05358610c2b50b679fa2812fe9f6/EnotVJl3_400x400.png', chains: ['ethereum'] },
  'injective': { name: 'Injective', max: 500000, cat: 'L2 / L1', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/YMAl62N6W7pJGRcRDyIYw/8a855775c397fed4fb89ddfee5cd84b8/injective.png', chains: ['ethereum'] },
  'resolv': { name: 'Resolv', max: 500000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/PVFDul5ntVzCg90oXYIWi/5ccd470c276900e19c507f93174d4eb0/1gDrgTdA_400x400.png', chains: ['ethereum'] },
  'symbiotic': { name: 'Symbiotic', max: 500000, cat: 'DeFi Staking', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/3JOu1jGRL3ble8qzc1DwcS/cc699f3aea75cafc031a7fa283606620/symbiotic.png', chains: ['ethereum'] },
  'nucleus': { name: 'Nucleus', max: 500000, cat: 'Infrastructure', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2qCwSDuVU4ePltEqcJE5cc/73041be9b5fc4d3993c94d4574dcfb93/Nucleus.png', chains: ['ethereum'] },
  'kiln-defi': { name: 'Kiln DeFi', max: 500000, cat: 'DeFi Staking', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2rN68srCOESswyxdwjzdRM/90ac006b52d632dc6f51d60ea3122922/Kiln_Defi.png', chains: ['ethereum','arbitrum','optimism','polygon','bsc','base'] },
  'firedancer': { name: 'Firedancer', max: 500000, cat: 'Infrastructure', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2O0QVg3wfx8rp3u3rzgqUg/4df69f867867b9c6b65a0cc30533e0b4/Firedancer_Transparent.png', chains: ['solana'] },
  'babylon-labs': { name: 'Babylon Labs', max: 500000, cat: 'Infrastructure', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/5ZuVO0D8rx9fzSoB5UVsx4/e5f38f1b93be6cb32b6255c21f6db81c/NEW_Babylon_Labs.png', chains: ['bitcoin'] },
  'dexeprotocol': { name: 'DeXe Protocol', max: 500000, cat: 'Infrastructure', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/5ZQ0i4NAKMQyO19x7Z65k8/257b06a35dfa48dcdb2ec16351267695/71133570.png', chains: ['ethereum'] },
  'renzoprotocol': { name: 'Renzo Protocol', max: 500000, cat: 'DeFi Staking', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/5vS0LqsY8aTwXw4AXCjNrB/3a1542886af81a0885485f9187ecb693/2.0_Renzo_Black_Logo__1_.png', chains: ['ethereum'] },
  'sei': { name: 'Sei', max: 500000, cat: 'L2 / L1', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/1lOFdVmQG8KNmJhGtr8lhs/40400407c90b0736a8e506b081b70887/Sei_Labs_Logo.png', chains: ['ethereum'] },
  'mETH': { name: 'mETH Protocol', max: 500000, cat: 'DeFi Staking', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/5TuHbYiYuIs9pkt4uXgpYi/e3de325d4dccda8d68e8a4cc61e95050/mantle.png', chains: ['ethereum'] },
  'aera': { name: 'Aera', max: 500000, cat: 'DeFi', logo: null, chains: ['ethereum','arbitrum','base','polygon','optimism'] },
  'perennial': { name: 'Perennial', max: 500000, cat: 'DeFi Trading', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/4ycrPoQ936fnEBbl69XK77/824a5bb3ea88e9ebcb7a2b0bd01e746c/perennial_logo.jpeg', chains: ['ethereum'] },
  'kiln': { name: 'Kiln On-Chain v2', max: 500000, cat: 'DeFi Staking', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2iDDxMXgRnP06wYCjb4T3E/5c65c546efd0c74e47ac0db66e773bb5/Kiln_Defi.png', chains: ['ethereum'] },
  'utix': { name: 'Utix', max: 500000, cat: 'Infrastructure', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/11JCYUuvvCgVwDyzMmDklA/79a4bfd3682951f96d5ca851f6d9abdb/10_copy.png', chains: ['ethereum'] },
  'thresholdnetwork': { name: 'Threshold Network', max: 500000, cat: 'Bridge', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/5sXJAYkgjf0BtH2uarlVA3/1f1993cf792814921c5c289b57004768/token-symbol-purple.svg', chains: ['ethereum','arbitrum','optimism','polygon','solana','base'] },
  'hydration': { name: 'Hydration', max: 500000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/3lm40Mobfxo3pFJkKBXPuc/b12c4e4926c6c5185a9b2a0ce7ae106a/Hydration.png', chains: ['polkadot'] },
  'ankr': { name: 'Ankr', max: 500000, cat: 'Infrastructure', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/3LohZrbHuhcG4MgU2zrH4A/39bca0e7dc6e249cee3706c8c0021929/Ankr_logo.jpeg', chains: ['ethereum','bsc','polygon'] },
  'decentraland': { name: 'Decentraland', max: 500000, cat: 'Gaming/NFT', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/CXsZzmFYIOc6VRsmn4i4P/aa9602446e06cec6320bbab0f437ea98/decentraland-mana-logo_copy.png', chains: ['ethereum','polygon'] },
  'bifrostfinance': { name: 'Bifrost', max: 500000, cat: 'DeFi Staking', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/1tNOIPGrvNlWWhK1FBWj8w/c7bc0dad9e9b986ff06d577092790508/Bifrost_logo.jpeg', chains: ['polkadot'] },
  'orca': { name: 'Orca', max: 500000, cat: 'DEX', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/6p07t55yWuOlsHLiQV9xsM/61c489fc59e7233557039a6965c76000/Screenshot_2024-11-11_at_11.35.18___PM.png', chains: ['solana'] },
  'maple': { name: 'Maple', max: 500000, cat: 'DeFi Lending', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/eUOQ1h8f4Rp7j6crz0YSq/669fab983d425d27fad87560219065a5/Maple_Logo.jpg', chains: ['ethereum'] },
  'buttonwood': { name: 'Buttonwood', max: 500000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/4KQLVXSS65vjjJRtqM1PbQ/85eeab1addc2bdf186d9f37032c21fe2/logo__black___1_.png', chains: ['ethereum'] },
  'sherlock': { name: 'Sherlock', max: 500000, cat: 'Security Platform', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/7aux7xm6bBE32KgmsF1XGi/db78d0f1bdfc7b2f47b41a7b5b2aa7df/Screenshot_2024-11-15_at_1.16.08___AM.png', chains: ['ethereum'] },
  'instadapp': { name: 'Instadapp', max: 500000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/7jHZEinQjaABm48Sct1BZs/3d224c5a05bff575e14b98970f939667/Instadapp.jpeg', chains: ['ethereum','optimism','polygon'] },
  'rocketpool': { name: 'Rocket Pool', max: 500000, cat: 'DeFi Staking', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/3q1XTgKfkqJW9nCVPRp7r5/8afa695989d14412d92dc2e26d4c1a47/Rocket_Pool__1_.jpeg', chains: ['ethereum'] },
  'benqi': { name: 'BENQI', max: 500000, cat: 'DeFi Lending', logo: null, chains: ['avalanche'] },
  'AlphaVentureDAO': { name: 'Alpha Venture DAO', max: 500000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/71pklpx3jRf9XgK7fxlT8n/c7c77d4bcca1ee5dd85284c4c1f95c01/Alphafinance-logo.png', chains: ['ethereum','bsc','avalanche'] },
  'silofinance-v2': { name: 'Silo Finance V2', max: 350000, cat: 'DeFi Lending', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/24De5VCsfH9jV4NpjRiQ6W/244ff375931983ac032a372d5e399906/Screenshot_2024-11-15_at_12.54.01___AM.png', chains: ['ethereum'] },
  'defisaver': { name: 'DeFi Saver', max: 350000, cat: 'DeFi', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/1S8ggfDmWMZTN2T6wcMNaS/b56ce9699295511536c8e970e550ee9c/Defisaver-logo.jpg', chains: ['ethereum'] },
  'stakestone': { name: 'StakeStone', max: 300000, cat: 'DeFi Staking', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/lTWhtXDyfizGgVkU5Myjr/f2b9c05def378a446671efd050d90389/StakeStone.png', chains: ['ethereum','bitcoin'] },
  'etherfi': { name: 'Ether.fi', max: 300000, cat: 'DeFi Staking', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/6uARdqsJxpv7UY78Xbg27/bce4b93c8e971a1a55315d80310f1b9f/ether_fi1677585111698.png', chains: ['ethereum'] },
  'alchemix': { name: 'Alchemix', max: 300000, cat: 'DeFi Yield', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2NgcBC2slhGYI8qYGnTsCw/0616521e1a588b3a5373af0215dd2a2b/Alchemix-logo.png', chains: ['ethereum','arbitrum','optimism'] },
  'Aevo': { name: 'Aevo', max: 300000, cat: 'DeFi Trading', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/1ORcP6RE6HcGhV4bTAv8AN/8ce035bee832701401c4576fda63117c/Ribbon-logo.svg', chains: ['ethereum','avalanche','bsc','solana'] },
  'parallel': { name: 'Parallel', max: 250000, cat: 'DeFi Lending', logo: 'https://images.ctfassets.net/t3wqy70tc3bv/2cR3OuUeSXBHqSGDcezrsX/90bffee28924be018f95fac32470840b/Parallel_Protocol.png', chains: ['ethereum','polygon','arbitrum','avalanche','base','optimism'] },
  'yearnfinance': { name: 'Yearn Finance', max: 250000, cat: 'DeFi Yield', logo: null, chains: ['ethereum'] },
  'synthetix': { name: 'Synthetix', max: 200000, cat: 'DeFi', logo: null, chains: ['ethereum','optimism'] },
  'thorchain': { name: 'THORChain', max: 200000, cat: 'DEX', logo: null, chains: ['ethereum'] },
  'pendle': { name: 'Pendle', max: 200000, cat: 'DeFi Yield', logo: null, chains: ['ethereum','arbitrum'] },
  'sushiswap': { name: 'SushiSwap', max: 200000, cat: 'DEX', logo: null, chains: ['ethereum','arbitrum','polygon','bsc','base','optimism'] },
  'morpho': { name: 'Morpho', max: 200000, cat: 'DeFi Lending', logo: null, chains: ['ethereum','base'] },
  'nexusmutual': { name: 'Nexus Mutual', max: 200000, cat: 'DeFi', logo: null, chains: ['ethereum'] },
  'velodromefinance': { name: 'Velodrome Finance', max: 200000, cat: 'DEX', logo: null, chains: ['optimism','base'] },
  'moonwell': { name: 'Moonwell', max: 200000, cat: 'DeFi Lending', logo: null, chains: ['base','optimism'] },
  'sommelier': { name: 'Sommelier', max: 200000, cat: 'DeFi Yield', logo: null, chains: ['ethereum'] },
  'swell': { name: 'Swell', max: 200000, cat: 'DeFi Staking', logo: null, chains: ['ethereum'] },
  'radiant': { name: 'Radiant', max: 200000, cat: 'DeFi Lending', logo: null, chains: ['arbitrum','bsc'] },
  'dforce': { name: 'dForce', max: 200000, cat: 'DeFi', logo: null, chains: ['ethereum','arbitrum','optimism','bsc'] },
  'hashflow': { name: 'Hashflow', max: 200000, cat: 'DEX', logo: null, chains: ['ethereum','arbitrum','bsc','polygon','optimism','avalanche'] },
  'traderjoe': { name: 'Trader Joe', max: 200000, cat: 'DEX', logo: null, chains: ['avalanche','arbitrum','bsc'] },
  'beefyfinance': { name: 'Beefy Finance', max: 200000, cat: 'DeFi Yield', logo: null, chains: ['ethereum','arbitrum','optimism','polygon','bsc','base','avalanche'] },
  'badger': { name: 'Badger', max: 200000, cat: 'DeFi Yield', logo: null, chains: ['ethereum','arbitrum'] },
  'tokemak': { name: 'Tokemak', max: 200000, cat: 'DeFi', logo: null, chains: ['ethereum'] },
  'livepeer': { name: 'Livepeer', max: 200000, cat: 'Infrastructure', logo: null, chains: ['ethereum','arbitrum'] },
  'forta': { name: 'Forta', max: 200000, cat: 'Security Platform', logo: null, chains: ['ethereum','polygon'] },
  'goldfinch': { name: 'Goldfinch', max: 200000, cat: 'DeFi Lending', logo: null, chains: ['ethereum'] },
  'superfluid': { name: 'Superfluid', max: 200000, cat: 'DeFi', logo: null, chains: ['ethereum','polygon','arbitrum','optimism','bsc','base'] },
  'filecoin': { name: 'Filecoin', max: 200000, cat: 'Infrastructure', logo: null, chains: ['ethereum'] },
  'biconomy': { name: 'Biconomy', max: 200000, cat: 'Infrastructure', logo: null, chains: ['ethereum','polygon','arbitrum','optimism','bsc','base'] },
  'dhedge': { name: 'dHEDGE', max: 200000, cat: 'DeFi', logo: null, chains: ['ethereum','optimism','polygon','arbitrum','base'] },
  'woofi': { name: 'WOOFi', max: 200000, cat: 'DEX', logo: null, chains: ['ethereum','arbitrum','bsc','polygon','optimism','avalanche','base'] },
  'pooltogether': { name: 'PoolTogether', max: 200000, cat: 'DeFi', logo: null, chains: ['ethereum','optimism','polygon','arbitrum','base','avalanche'] },
  'gainsnetwork': { name: 'Gains Network', max: 200000, cat: 'DeFi Trading', logo: null, chains: ['arbitrum','polygon'] },
  'connext': { name: 'Connext', max: 200000, cat: 'Bridge', logo: null, chains: ['ethereum','arbitrum','optimism','polygon','bsc'] },
  'debridge': { name: 'deBridge', max: 200000, cat: 'Bridge', logo: null, chains: ['ethereum','arbitrum','optimism','polygon','bsc','base','solana'] },
  'thegraph': { name: 'The Graph', max: 200000, cat: 'Infrastructure', logo: null, chains: ['ethereum','arbitrum'] },
  'pythnetwork': { name: 'Pyth Network', max: 200000, cat: 'Infrastructure', logo: null, chains: ['solana','ethereum','arbitrum','optimism','polygon','bsc','base'] },
  'ipor': { name: 'IPOR', max: 200000, cat: 'DeFi', logo: null, chains: ['ethereum','arbitrum'] },
  'kelp-dao': { name: 'Kelp DAO', max: 200000, cat: 'DeFi Staking', logo: null, chains: ['ethereum'] },
  'exactly': { name: 'Exactly', max: 200000, cat: 'DeFi Lending', logo: null, chains: ['ethereum','optimism'] },
  'superform': { name: 'Superform', max: 200000, cat: 'DeFi Yield', logo: null, chains: ['ethereum','arbitrum','optimism','polygon','bsc','base','avalanche'] },
  'kwenta': { name: 'Kwenta', max: 200000, cat: 'DeFi Trading', logo: null, chains: ['optimism','base'] },
  'synfutures': { name: 'SynFutures', max: 200000, cat: 'DeFi Trading', logo: null, chains: ['ethereum','blast'] },
  'indexcoop': { name: 'Index Coop', max: 200000, cat: 'DeFi', logo: null, chains: ['ethereum','arbitrum'] },
  'lyra': { name: 'Lyra', max: 200000, cat: 'DeFi Trading', logo: null, chains: ['ethereum','optimism','arbitrum'] },
};

// Existing files
const existingFiles = new Set(
  fs.readdirSync(PROTOCOLS_DIR)
    .filter(f => f.endsWith('.json') && f !== '_index.json' && f !== 'protocol_template.json')
    .map(f => f.replace('.json', ''))
);

console.log(`Existing: ${existingFiles.size} protocols`);

// Slug normalization: some snapshot slugs need mapping to our file names
const SLUG_REMAP = {
  'inversefinance': 'inverse-finance',
  'originprotocol': 'origin-protocol',
  'reffinance': 'ref-finance',
  'ssvnetwork': 'ssv-network',
  'zestprotocol': 'zest-protocol-v2',
  'makerdao': 'sky', // Already have sky
};

let created = 0;
const allSlugs = new Set(existingFiles);

for (const rawSlug of ALL_SLUGS) {
  // Normalize slug to lowercase kebab
  let slug = rawSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '');

  // Check remaps
  if (SLUG_REMAP[slug]) {
    slug = SLUG_REMAP[slug];
  }

  // Skip if already exists
  if (allSlugs.has(slug)) continue;

  // Lookup known data
  const known = KNOWN_DATA[rawSlug] || KNOWN_DATA[slug] || {};
  const name = known.name || rawSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const maxBounty = known.max || 100000;
  const category = known.cat || 'DeFi';
  const chains = known.chains || ['ethereum'];
  const logoUrl = known.logo || null;

  const critMax = maxBounty;
  const critMin = Math.max(Math.floor(maxBounty * 0.25), 1000);
  const highMax = Math.max(Math.floor(maxBounty * 0.1), 5000);
  const highMin = Math.max(Math.floor(maxBounty * 0.01), 1000);
  const medMax = Math.max(Math.floor(maxBounty * 0.01), 1000);
  const medMin = Math.max(Math.floor(maxBounty * 0.001), 500);

  const protocol = {
    slug,
    name,
    description: `${name} bug bounty program on Immunefi`,
    category,
    logo_url: logoUrl,
    chains,
    bounty: {
      max: maxBounty,
      min: medMin,
      kyc_required: false,
      payout_token: 'USDC',
    },
    severity_payouts: {
      critical: { min: critMin, max: critMax, description: 'Direct theft of user funds or protocol insolvency' },
      high: { min: highMin, max: highMax, description: 'Temporary freezing of funds or manipulation' },
      medium: { min: medMin, max: medMax, description: 'Griefing or protocol disruption' },
    },
    source: 'immunefi',
    contracts: [],
    scope: {
      in_scope: ['Smart contracts in scope per Immunefi listing'],
      out_of_scope: ['Frontend applications', 'Off-chain infrastructure'],
    },
    updated_at: '2026-02-10T00:00:00Z',
  };

  const filePath = path.join(PROTOCOLS_DIR, `${slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(protocol, null, 2) + '\n');
  allSlugs.add(slug);
  created++;
}

console.log(`Created ${created} new protocol files`);
console.log(`Total: ${allSlugs.size} protocols`);

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
