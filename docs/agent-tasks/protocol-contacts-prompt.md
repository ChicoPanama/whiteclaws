# Protocol Security Contact Extraction — Browser Agent Task

## Mission
Visit each protocol's OWN website and GitHub org to find their security contact info.
Do NOT visit Immunefi — we already scraped everything from there.

## What To Extract Per Protocol
```json
{
  "slug": "layerzero",
  "security_email": "security@layerzerolabs.org",
  "contact_email": "enterprise@layerzerolabs.org",
  "contact_telegram": "https://t.me/layerzero",
  "contact_discord": "https://discord.gg/layerzero",
  "contact_twitter": "@LayerZero_Labs",
  "github_org": "https://github.com/LayerZero-Labs",
  "security_page_url": "https://layerzero.network/security",
  "source": "website_footer + github_org_readme"
}
```

## Where To Look (in order)

### 1. Protocol Website
- **Footer** — almost every site has social links (Twitter, Discord, Telegram) in the footer
- **/security** or **/bug-bounty** page — some protocols have a dedicated security page with email
- **/contact** or **/about** page — general contact info
- **/terms** or **/legal** page — often has a legal/notices email address
- **security.txt** — try {website}/.well-known/security.txt
- Look for `mailto:` links anywhere on the page

### 2. GitHub Organization Page
- **Org profile/README** — many orgs list Website, Docs, Twitter, Telegram, Discord links
- **SECURITY.md** — check the main repo for a SECURITY.md file with disclosure email
- **.github/SECURITY.md** — some orgs put it in the .github repo
- **Repo descriptions** — sometimes have contact links

### 3. Documentation Site
- **docs.{domain}** — often has a security section or contact info
- Look for /security, /bug-bounty, /responsible-disclosure paths

## Output Format
JSON array. One object per protocol. Only include protocols where you found at least one contact.
In the `source` field, note where you found each piece of info (e.g. 'website_footer', 'github_readme', 'security.txt', 'terms_page').
Save as `protocol_contacts.json`

## Protocol List
Total: 446 protocols
Format: `slug | name | website | github`

0x | 0x | https://0x.org | https://github.com/0xProject
88mphv3 | 88mphV3 | https://88mph.app | https://github.com/88mphapp
aave | AAVE | https://aave.com | https://github.com/aave-dao
acala | Acala | https://acala.network | https://github.com/AcalaNetwork
aera | Aera | https://aera.finance | NO_GITHUB
aevo | Aevo | https://app.aevo.xyz | NO_GITHUB
alchemix | Alchemix | https://alchemix.fi | https://github.com/alchemix-finance
aleo | Aleo | https://aleo.org | https://github.com/ProvableHQ
alephzero |  | https://alephzero.org | NO_GITHUB
alex | ALEX | https://alexlab.co | https://github.com/alexgo-io
aloeprotocol |  | https://aloe.capital | NO_GITHUB
alongside |  | https://alongside.xyz | NO_GITHUB
alpacafinance |  | https://alpacafinance.org | NO_GITHUB
alpen-labs | Alpen Labs | https://alpenlabs.io | https://github.com/alpenlabs
alphaventuredao | Alpha Venture DAO | https://alpha.wtf | https://github.com/n1punp
ambire |  | https://ambire.com | NO_GITHUB
angleprotocol |  | https://app.angle.money | NO_GITHUB
ankr | Ankr | https://ankr.com | NO_GITHUB
antefinance | Ante Finance | https://ante.finance | NO_GITHUB
anvil |  | https://anvil.xyz | NO_GITHUB
apecoinmainnet |  | https://apechain.com | NO_GITHUB
arbitrum | Arbitrum | https://arbitrum.foundation | https://github.com/OffchainLabs
arborfinance |  | https://arbor.finance | NO_GITHUB
arcade |  | https://arcade.xyz | NO_GITHUB
arkadiko | Arkadiko | https://arkadiko.finance | NO_GITHUB
arkham | Arkham | https://arkhamintelligence.com | NO_GITHUB
aspida | Aspida | https://aspidanet.com | NO_GITHUB
astarnetwork | Astar Network | https://astar.network | https://github.com/AstarNetwork
aster | Aster | https://asterdex.com | https://github.com/asterdex/api-docs/blob/master/aster-finance-api.md
astroport | Astroport | https://astroport.fi | https://github.com/astroport-fi
aurafinance | Aura Finance | https://aura.finance | NO_GITHUB
autonolas | Autonolas | https://olas.network | NO_GITHUB
avail | Avail | https://availproject.org | https://github.com/availproject
avalabs | Ava Labs | https://avax.network | https://github.com/ava-labs
avalanche | Ava Labs Avalanche | https://avax.network | https://github.com/ava-labs
axelarnetwork | Axelar Network | https://axelar.network | https://github.com/axelarnetwork
axiom |  | https://axiom.trade | NO_GITHUB
baanx | Baanx | https://withcl.com | NO_GITHUB
babylon-labs | Babylon Labs | https://babylonlabs.io | https://github.com/babylonlabs-io
badger |  | https://badger.com | NO_GITHUB
balancer | Balancer | https://balancer.fi | NO_GITHUB
balmy |  | https://balmy.xyz | NO_GITHUB
bankx |  | https://bankx.io | NO_GITHUB
baofinance |  | https://baoswap.xyz | NO_GITHUB
basilisk | Basilisk | https://basilisk.org | https://github.com/galacticcouncil
beanstalk | Beanstalk | https://bean.money | NO_GITHUB
beefyfinance | Beefy Finance | https://beefy.com | NO_GITHUB
beethovenx |  | https://beets.fi | NO_GITHUB
beets | Beets | https://beets.fi | NO_GITHUB
benddao |  | https://bend.berachain.com | NO_GITHUB
benqi | BENQI | https://app.benqi.fi | NO_GITHUB
berachain | Berachain | https://berachain.com | https://github.com/berachain
berachain-webapps | Berachain (Web/Apps) | https://berachain.com | NO_GITHUB
beradrome | Beradrome | https://beradrome.com | NO_GITHUB
betafinance |  | https://betafinance.org | NO_GITHUB
biconomy |  | https://biconomy.com | NO_GITHUB
bifi | BiFi | https://bifi.finance | NO_GITHUB
bifrostfinance | Bifrost | https://bifrost.io | https://github.com/bifrost-io
bitcoinsv | Bitcoin SV | https://bitcoin.org | https://github.com/bitcoin-sv
bitflow | Bitflow | https://bitflow.finance | NO_GITHUB
bitswift |  | https://bits.financial | NO_GITHUB
blackwing |  | https://blackwing.fi | NO_GITHUB
blockpinetwork | BlockPI Network | https://blockpi.io | NO_GITHUB
blockwallet |  | https://blockwallet.io | NO_GITHUB
bobanetwork | Boba Network | https://gateway.boba.network | NO_GITHUB
bondprotocol |  | https://bondprotocol.finance | NO_GITHUB
bonfida |  | https://bonfida.org | NO_GITHUB
bprotocol | BProtocol | https://b-lucky.gg | https://github.com/backstop-protocol
burrow | Burrow | https://burrow.finance | NO_GITHUB
buttonwood | Buttonwood | https://buttonwood.finance | https://github.com/buttonwood-protocol
c3 |  | https://c3.io | NO_GITHUB
capyfi | CapyFi | https://capyfi.com | https://github.com/Capyfi/capyfi-smart-contracts
carbonbancor |  | https://carbondefi.xyz | NO_GITHUB
cardanofoundation | Cardano Foundation | https://cardano.org | https://github.com/cardano-foundation
celer | Celer | https://celer.network | NO_GITHUB
ceres |  | https://cerestoken.io | NO_GITHUB
chainlink | Chainlink | https://chain.link | https://github.com/smartcontractkit
charm | Charm | https://alpha.charm.fi | https://github.com/charmfinance
comdex |  | https://comdex.one | NO_GITHUB
composablefinance |  | https://composable.finance | NO_GITHUB
compoundfinance | Compound Finance | https://v3-app.compound.finance | https://github.com/compound-finance
connext | Connext | https://connext.network | NO_GITHUB
contrax |  | https://beta.contrax.finance | NO_GITHUB
coreum | Coreum | https://coreum.com | https://github.com/CoreumFoundation
cove | Cove | https://cove.finance | https://github.com/Storm-Labs-Inc
cowprotocol | CoW Protocol | https://cow.fi | https://github.com/cowprotocol
cyan |  | https://cyan.finance | NO_GITHUB
daimo |  | https://daimo.com | NO_GITHUB
daimo-pay | Daimo Pay | https://daimo.com | https://github.com/daimo-eth/pay
darwinia |  | https://darwinia.network | NO_GITHUB
davos |  | https://davos.xyz | NO_GITHUB
debridge | deBridge | https://app.debridge.com | NO_GITHUB
decentraland | Decentraland | https://decentraland.org | NO_GITHUB
defisaver | DeFi Saver | https://defisaver.com | https://github.com/defisaver
defly |  | https://defly.app | NO_GITHUB
degate |  | https://app.degate.com | NO_GITHUB
delv |  | https://delv.tech | NO_GITHUB
deriprotocol | Deri Protocol | https://deri.io | https://github.com/deri-protocol
dexeprotocol | DeXe Protocol | https://dexe.network | NO_GITHUB
dforce | dForce | https://dforce.network | https://github.com/dforce-network
dfxfinance | DFX Finance | https://app.dfx.finance | NO_GITHUB
dhedge | dHEDGE | https://dhedge.org | NO_GITHUB
dodo | DODO | https://dodoex.io | https://github.com/DODOEX
dodov3 |  | https://dodoex.io | NO_GITHUB
driftprotocol |  | https://app.drift.trade | NO_GITHUB
drips | Drips | https://drip.community | NO_GITHUB
duetfinance |  | https://duet.finance | NO_GITHUB
ebtc |  | https://ebtc.finance | NO_GITHUB
eclipse | Eclipse | https://eclipse.xyz | NO_GITHUB
eco |  | https://econialabs.com | NO_GITHUB
econia |  | https://econialabs.com | NO_GITHUB
eigenlayer | EigenLayer | https://eigenlayer.xyz | NO_GITHUB
elixirprotocol | Elixir Network | https://elixir.xyz | NO_GITHUB
enosys |  | https://enosys.global | NO_GITHUB
ens | ENS | https://app.ens.domains | https://github.com/ensdomains
ensuro | Ensuro | https://ensuro.co | NO_GITHUB
enzyme-onyx | Enzyme Onyx | https://enzyme.finance | https://github.com/enzymefinance/protocol-onyx
enzymefinance | Enzyme Blue | https://enzyme.finance | https://github.com/enzymefinance/protocol
ethena | Ethena | https://app.ethena.fi | NO_GITHUB
etherfi | Ether.fi | https://ether.fi | NO_GITHUB
euphrates |  | https://euphrates.finance | NO_GITHUB
exactly | Exactly | https://exact.ly | NO_GITHUB
exodus | Exodus | https://exodus.com | https://github.com/ExodusMovement
extrafinance | Extra Finance | https://app.extrafi.io | NO_GITHUB
farcaster | Farcaster | https://farcaster.xyz | NO_GITHUB
fassets | Flare FAssets | https://flare.network | https://github.com/flare-foundation/fassets
fbtc | FBTC | https://fbtc.com | https://github.com/fbtc-com
felix | Felix | https://usefelix.xyz | NO_GITHUB
filecoin | Filecoin | https://filecoin.io | https://github.com/whyrusleeping
firedancer | Firedancer | https://jumpcrypto.com | https://github.com/firedancer-io
flamingofinance | Flamingo Finance | https://flamingo.finance | https://github.com/neo-project
flarenetwork | Flare Network | https://flare.network | https://github.com/flare-foundation/
flexytech |  | https://flexy.tech | NO_GITHUB
floki |  | https://flokifi.com | NO_GITHUB
fluxfinance | Flux Finance | https://fluxfinance.com | NO_GITHUB
foil | FOIL | https://foil.xyz | https://github.com/foilxyz
folksfinance | Folks Finance | https://folks.finance | https://github.com/Folks-Finance
forta | Forta Network | https://forta.org | NO_GITHUB
foundation |  | https://foundation.app | NO_GITHUB
furucombo |  | https://furucombo.app | NO_GITHUB
furucombofunds |  | https://furucombo.app | NO_GITHUB
gainsnetwork | Gains Network | https://gains.trade | NO_GITHUB
galagames | Gala Games | https://gala.com | NO_GITHUB
gamma | Gamma | https://gamma.xyz | NO_GITHUB
gammaswap | GammaSwap | https://gamma.xyz | NO_GITHUB
gear | Gear | https://gearbox.finance | https://github.com/gear-tech
gearbox | Gearbox | https://gearbox.finance | https://github.com/Gearbox-protocol
geniusyield | Genius Yield | https://geniusyield.co | https://github.com/geniusyield
gerowallet |  | https://gerowallet.io | NO_GITHUB
ghostmarket |  | https://ghostmarket.io | NO_GITHUB
glodollar | Glo Dollar | https://glodollar.org | NO_GITHUB
gmx | GMX | https://gmx.io | NO_GITHUB
gnosischain | Gnosis Chain | https://gnosis.io | NO_GITHUB
gogopool | GoGoPool | https://gogopool.com | NO_GITHUB
goldfinch |  | https://goldfinch.finance | NO_GITHUB
granite-protocol | Granite Protocol | https://app.granite.world | https://github.com/GraniteProtocol
gysr |  | https://gysr.io | NO_GITHUB
harvest | Harvest Finance | https://harvest.finance | https://github.com/harvestfi
hashflow | Hashflow | https://hashflow.com | NO_GITHUB
hathornetwork | Hathor Network | https://hathor.network | https://github.com/HathorNetwork
haven1 | Haven1 | https://swap.haven1.org | NO_GITHUB
hedera | Hedera | https://hedera.com | https://github.com/hashgraph/
hibachi | Hibachi | https://hibachi.xyz | NO_GITHUB
horizen | Horizen | https://horizen.io | https://github.com/HorizenOfficial
hourglass | Hourglass | https://hourglass.com | NO_GITHUB
hydradx |  | https://hydration.net | NO_GITHUB
hydration | Hydration | https://hydration.net | https://github.com/galacticcouncil
hydro |  | https://app.hydroprotocol.finance | NO_GITHUB
hyperlane | Hyperlane | https://hyperlane.xyz | NO_GITHUB
ichi | Ichi | https://ichi.org | https://github.com/ichifarm
icon |  | https://icon.foundation | NO_GITHUB
idex |  | https://kuma.bid | NO_GITHUB
idlefinance |  | https://idle.finance | NO_GITHUB
illuvium |  | https://illuvium.io | NO_GITHUB
immunefi | Immunefi | https://immunefi.com | NO_GITHUB
immutable | Immutable | https://immutable.com | https://github.com/immutable/
impossible-cloud-network | Impossible Cloud Network | https://impossible.cloud | NO_GITHUB
impossiblefinance | Impossible Finance | https://impossible.finance | https://github.com/ImpossibleFinance
indexcoop | Index Coop | https://indexcoop.com | NO_GITHUB
infinex | Infinex | https://infinex.xyz | NO_GITHUB
injective | Injective | https://injective.com | https://github.com/injectivelabs
instadapp | Instadapp | https://instadapp.io | https://github.com/Instadapp
integral | Integral | https://integral.link | NO_GITHUB
integriteenetwork |  | https://integritee.network | NO_GITHUB
interlay | Interlay | https://interlay.io | https://github.com/interlay
intmax | INTMAX | https://intmax.io | https://github.com/InternetMaximalism
inverse-finance | Inverse Finance | https://inverse.finance | NO_GITHUB
ion-protocol |  | https://ionprotocol.io | NO_GITHUB
ipor | IPOR | https://ipor.io | NO_GITHUB
jito | Jito | https://jito.network | https://github.com/jito-foundation
jito-bam-client | Jito - BAM Client | https://jito.network | https://github.com/jito-labs
jito-foundation |  | https://jito.network | NO_GITHUB
justlenddao | JustLend DAO | https://justlend.just.network | NO_GITHUB
kadena |  | https://kadena.io | NO_GITHUB
kamino | Kamino | https://kamino.com | https://github.com/Kamino-Finance
keep3rnetwork |  | https://keep3r.network | NO_GITHUB
kelp-dao | Kelp DAO | https://kelpdao.xyz | NO_GITHUB
kiln | Kiln On-Chain v2 | https://kiln.fi | NO_GITHUB
kiln-defi | Kiln DeFi | https://kiln.fi | NO_GITHUB
kiln-on-chain-v1 | Kiln On-Chain v1 | https://kiln.fi | NO_GITHUB
kiln-webapp | Kiln (dApp/Infra) | https://kiln.fi | NO_GITHUB
kinesis-bridge-on-kadena |  | https://kadena.io | NO_GITHUB
kwenta |  | https://kwenta.eth.limo | NO_GITHUB
landx |  | https://landx.fi | NO_GITHUB
layerzero | LayerZero | https://layerzero.network | https://github.com/LayerZero-Labs
lendr |  | https://lendr.xyz | NO_GITHUB
lido | Lido | https://lido.fi | https://github.com/lidofinance
lidoonpolygon |  | https://lido.fi | NO_GITHUB
lifi |  | https://lifinity.io | NO_GITHUB
light-protocol | Light Protocol | https://lightprotocol.com | https://github.com/Lightprotocol
linea | Linea | https://bridge.linea.build | https://github.com/Consensys/linea-monorepo
liquidswap |  | https://liquidswap.com | NO_GITHUB
listadao | Lista DAO | https://lista.org | NO_GITHUB
livepeer | Livepeer | https://livepeer.org | NO_GITHUB
localtraders |  | https://localtraders.com | NO_GITHUB
lombard-finance | Lombard Finance | https://lombard.finance | NO_GITHUB
lossless |  | https://lossless.io | NO_GITHUB
lybrafinance |  | https://lybra.finance | NO_GITHUB
lyra | Lyra | https://lyra.finance | NO_GITHUB
magpiexyz | MagpieXYZ | https://magpiexyz.io | NO_GITHUB
mantlelsp |  | https://mantle.xyz | NO_GITHUB
maple | Maple | https://maple.finance | NO_GITHUB
marinade | Marinade | https://app.marinade.finance | https://github.com/marinade-finance
mars |  | https://marsprotocol.io | NO_GITHUB
marsecosystem | Mars Ecosystem | https://marsecosystem.com | NO_GITHUB
mayaprotocol | Maya Protocol | https://mayaprotocol.com | NO_GITHUB
meanfinance |  | https://mean.finance | NO_GITHUB
metalswap |  | https://app.metalswap.finance | NO_GITHUB
metastreet | MetaStreet | https://metastreet.xyz | https://github.com/metastreet-labs
metastreet-yield-pass |  | https://metastreet.xyz | NO_GITHUB
meth | mETH Protocol | https://methprotocol.xyz | NO_GITHUB
metis |  | https://metis.io | NO_GITHUB
metronome | Metronome | https://metronome.io | NO_GITHUB
monero-oxide | monero-oxide | https://monero.com | https://github.com/monero-oxide/monero-oxide
moneyonchain | Money on Chain | https://moneyonchain.com | https://github.com/money-on-chain
moonbeamnetwork | Moonbeam Network | https://moonbeam.network | https://github.com/moonbeam-foundation
moonwell |  | https://moonwell.fi | NO_GITHUB
morpho | Morpho | https://app.morpho.org | NO_GITHUB
mountainprotocol |  | https://mountainprotocol.com | NO_GITHUB
mtpelerin | Mt Pelerin | https://mtpelerin.com | https://github.com/MtPelerin
mux | MUX | https://mux.network | https://github.com/mux-world
myntandzero | Mynt and Zero | https://sovryn.com | https://github.com/DistributedCollective
native |  | https://native.org | NO_GITHUB
nayms |  | https://nayms.com | NO_GITHUB
neo | Neo | https://neotokyo.codes | https://github.com/neo-project
neutron | Neutron | https://neutron.org | https://github.com/neutron-org
nexusmutual | Nexus Mutual | https://nexusmutual.io | https://github.com/NexusMutual
nftfi | NFTfi | https://nftfi.com | NO_GITHUB
nftfitestnetrefi | NFTfi (Testnet Refi) | https://nftfi.com | NO_GITHUB
nftx |  | https://nftx.io | NO_GITHUB
nodle |  | https://nodle.com | NO_GITHUB
nomad |  | https://nomad.xyz | NO_GITHUB
notional | Notional | https://notional.finance | NO_GITHUB
nucleus | Nucleus | https://nucleusearn.io | NO_GITHUB
oasis | Oasis | https://oasisprotocol.org | https://github.com/oasisprotocol
obyte | Obyte | https://friends.obyte.org | https://github.com/byteball
oceanprotocol |  | https://ocean.one | NO_GITHUB
octopusnetwork |  | https://omnity.network | NO_GITHUB
ofza-1 | OFZA | https://ofza.io | NO_GITHUB
olafinance |  | https://ola.finance | NO_GITHUB
olympus | Olympus | https://olympusdao.finance | NO_GITHUB
omni-network |  | https://nomina.io | NO_GITHUB
omron | Subnet 2 | https://omron.network | https://github.com/inference-labs-inc/subnet-2
ondofinance | Ondo Finance | https://ondo.finance | NO_GITHUB
openzeppelin | OpenZeppelin | https://openzeppelin.com | https://github.com/OpenZeppelin
openzeppelin-stellar | OpenZeppelin on Stellar | https://openzeppelin.com | https://github.com/OpenZeppelin
optimism | Optimism | https://app.optimism.io | https://github.com/ethereum-optimism
opyngamma |  | https://opyn.co | NO_GITHUB
opynsqueeth |  | https://squeeth.opyn.co | NO_GITHUB
orca | Orca | https://orca.so | https://github.com/orca-so
orderlynetwork | Orderly Network | https://orderly.network | https://github.com/OrderlyNetwork
origin-protocol | Origin Protocol | https://originprotocol.com | NO_GITHUB
origindefi |  | https://originprotocol.com | NO_GITHUB
ostium | Ostium | https://ostium.io | NO_GITHUB
overlay |  | https://overlay.market | NO_GITHUB
pact |  | https://app.pact.fi | NO_GITHUB
pancakeswap | PancakeSwap | https://pancakeswap.finance | https://github.com/pancakeswap
pantos | Pantos | https://pantos.io | NO_GITHUB
paradex | Paradex | https://app.paradex.trade | NO_GITHUB
paragonsdao |  | https://app.paragonsdao.com | NO_GITHUB
parallel | Parallel | https://parallel.best | https://github.com/parallel-protocol
parallelwallet |  | https://parallel.fi | NO_GITHUB
pareto | Pareto Credit | https://pareto.credit | NO_GITHUB
paribus | Paribus | https://app.paribus.io | https://github.com/Paribus
pendle |  | https://pendle.finance | NO_GITHUB
perennial | Perennial | https://perennial.finance | NO_GITHUB
perpetual | Perpetual | https://app.perp.com | NO_GITHUB
pikaprotocol |  | https://pikaprotocol.com | NO_GITHUB
pillar | Pillar | https://pillarprotocol.com | NO_GITHUB
pinto | Pinto | https://pinto.money | https://github.com/pinto-org/
pnetwork |  | https://p.network | NO_GITHUB
pods |  | https://yield.pods.finance | NO_GITHUB
polkastarter | Polkastarter | https://polkastarter.com | NO_GITHUB
polygon | Polygon | https://polygon.technology | https://github.com/0xPolygon
polygonzkevm |  | https://portal.polygon.technology | NO_GITHUB
polymarket | Polymarket | https://polymarket.com | NO_GITHUB
polymesh | Polymesh | https://polymesh.network | https://github.com/PolymeshAssociation
poolshark |  | https://poolshark.fi | NO_GITHUB
pooltogether |  | https://pooltogether.com | NO_GITHUB
popsicle |  | https://popsicle.finance | NO_GITHUB
portfinance |  | https://port.finance | NO_GITHUB
pragmaoracle | Pragma Oracle | https://pragma.build | NO_GITHUB
predyfinance |  | https://predy.finance | NO_GITHUB
primitive |  | https://primitive.xyz | NO_GITHUB
print3r |  | https://print3r.xyz | NO_GITHUB
pstake |  | https://pstake.finance | NO_GITHUB
pstakeoncosmos |  | https://pstake.finance | NO_GITHUB
pushprotocol | Push Protocol | https://push.org | https://github.com/pushchain/push-smart-contracts/tree/bug_bounty_dev
pythnetwork | Pyth Network | https://pyth.network | https://github.com/pyth-network
qblockchain | Q Blockchain | https://q.org | NO_GITHUB
quadrata | Quadrata | https://plasma.finance | https://github.com/QuadrataNetwork
radiant |  | https://radiant.capital | NO_GITHUB
rai |  | https://railgun.org | NO_GITHUB
rangeprotocol |  | https://rangeprotocol.com | NO_GITHUB
raydium | Raydium | https://raydium.io | https://github.com/raydium-io
reaperfarm | Reaper Farm | https://app.re.xyz | NO_GITHUB
ref-finance | Ref Finance | https://app.re.xyz | https://github.com/ref-finance
renzoprotocol | Renzo Protocol | https://app.renzoprotocol.com | NO_GITHUB
reserve | Reserve | https://reserve.org | https://github.com/reserve-protocol
resolv | Resolv | https://app.resolv.xyz | https://github.com/resolv-im
resonate | Resonate | https://resonate.finance | https://github.com/Revest-Finance
revert | Revert | https://revert.finance | https://github.com/revert-finance
revest | Revest | https://revest.finance | https://github.com/Revest-Finance
rhinofi | Rhino.fi | https://rhino.fi | NO_GITHUB
ribbon |  | https://ribbon.finance | NO_GITHUB
ringdao |  | https://ring.exchange | NO_GITHUB
rocketpool | Rocket Pool | https://rocketpool.net | https://github.com/rocket-pool
router |  | https://routerprotocol.com | NO_GITHUB
royco | Royco | https://royco.org | https://github.com/roycoprotocol
rubic | Rubic | https://app.rubic.exchange | https://github.com/Cryptorubic
ruscet |  | https://ruscet.xyz | NO_GITHUB
rysk |  | https://app.rysk.finance | NO_GITHUB
scroll | Scroll | https://portal.scroll.io | https://github.com/scroll-tech
sectorfinance | Sector Finance | https://sector.finance | NO_GITHUB
securefi |  | https://securefi.io | NO_GITHUB
segmentfinance | Segment Finance | https://segment.finance | https://github.com/Segment-Finance
sei | Sei | https://sei.io | https://github.com/sei-protocol
serai | Serai | https://serai.exchange | https://github.com/serai-dex/serai
shellprotocol |  | https://shellprotocol.io | NO_GITHUB
sherlock | Sherlock | https://sherlock.xyz | NO_GITHUB
silofinance |  | https://app.silo.finance | NO_GITHUB
silofinance-v2 | Silo Finance V2 | https://silo.finance | https://github.com/silo-finance/silo-contracts-v2
singularitydao |  | https://singularitydao.ai | NO_GITHUB
skatefi | SkateFi | https://rangeprotocol.com | https://github.com/Range-Protocol
sky | Sky | https://app.sky.money | https://github.com/sky-ecosystem
smardex |  | https://smardex.io | NO_GITHUB
sns | SNS | https://sns.id | https://github.com/SolanaNameService
sommelier |  | https://somm.finance | NO_GITHUB
sora | SORA | https://sorare.com | https://github.com/sora-xor
sovryn | Sovryn | https://sovryn.app | https://github.com/DistributedCollective
sparklend | Spark | https://app.spark.fi | https://github.com/marsfoundation
spectral |  | https://spectral.finance | NO_GITHUB
spookyswap |  | https://spookybase.io | NO_GITHUB
spool |  | https://spool.fi | NO_GITHUB
spot | SPOT | https://spot.cash | NO_GITHUB
ssv-network | SSV Network | https://ssv.network | NO_GITHUB
stackingdao | StackingDAO | https://app.stackingdao.com | NO_GITHUB
stacks | Stacks | https://docs.stacks.co | https://github.com/stacks-sbtc
staderforbnb | Stader for BNB | https://staderlabs.com | NO_GITHUB
staderforeth | Stader for ETH | https://staderlabs.com | NO_GITHUB
staderforpolygon | Stader for Polygon | https://staderlabs.com | NO_GITHUB
stafi |  | https://stafi.io | NO_GITHUB
stakeeasy | StakeEasy | https://stakee.org | NO_GITHUB
stakelink | stake.link | https://stake.link | https://github.com/stakedotlink
stakestone | StakeStone | https://stakestone.io | NO_GITHUB
stakewise | StakeWise Mainnet | https://stakewise.io | NO_GITHUB
stargate | Stargate | https://stargate.vechain.org | NO_GITHUB
starkex | StarkEx | https://starkware.co | https://github.com/starkware-libs
starknet | StarkNet | https://starkgate.starknet.io | https://github.com/starkware-libs
starknet-staking | Starknet Staking | https://starknet.io | https://github.com/starkware-libs
stellar | Stellar | https://developers.stellar.org | https://github.com/stellar
stellaswap | StellaSwap | https://app.stellaxyz.io | NO_GITHUB
strikefinance |  | https://strikefinance.org | NO_GITHUB
sturdy |  | https://v2.sturdy.finance | NO_GITHUB
summerfi |  | https://summer.fi | NO_GITHUB
superbots |  | https://superbots.finance | NO_GITHUB
superfluid |  | https://superfluid.org | NO_GITHUB
superform | Superform (v1 SuperVaults) | https://app.superform.xyz | https://github.com/superform-xyz
sushiswap | SushiSwap | https://sushi.com | NO_GITHUB
swappi |  | https://app.swappi.io | NO_GITHUB
sweateconomy | Sweat Economy | https://sweateconomy.com | https://github.com/sweatco
swell | Swell | https://swellnetwork.io | NO_GITHUB
symbiosis | Symbiosis | https://symbiosis.finance | NO_GITHUB
symbiotic | Symbiotic | https://symbiotic.fi | https://github.com/symbioticfi
synfutures |  | https://trade.synfutures.com | NO_GITHUB
synthetix | Synthetix | https://synthetix.io | https://github.com/Synthetixio
teahousefinance | Teahouse Finance | https://vault.teahouse.finance | NO_GITHUB
templar-protocol | Templar Protocol | https://templarfi.org | NO_GITHUB
termstructurelabs | TermMax | https://termstructure.com | https://github.com/term-structure
tetu | Tetu | https://tetu.io | NO_GITHUB
thala-protocol | Thala Protocol | https://thala.fi | NO_GITHUB
thegraph |  | https://thegraph.com | NO_GITHUB
thesandbox | The Sandbox | https://sandbox.game | NO_GITHUB
thorchain |  | https://thorchain.org | NO_GITHUB
thresholdnetwork | Threshold Network | https://app.thresholdusd.org | https://github.com/threshold-network
thusd |  | https://thuvault.com | NO_GITHUB
tidal |  | https://tidal.finance | NO_GITHUB
timelessandbunni |  | https://timelessfi.com | NO_GITHUB
tinyman | Tinyman | https://tinyman.org | https://github.com/tinymanorg
tinymanv2 |  | https://tinyman.org | NO_GITHUB
tokemak |  | https://tokemak.xyz | NO_GITHUB
toucan |  | https://toucan.earth | NO_GITHUB
traderjoe | Trader Joe | https://traderjoexyz.com | NO_GITHUB
tranchess | Tranchess | https://tranchess.com | NO_GITHUB
tropykus | Tropykus | https://app.tropykus.com | NO_GITHUB
trufin | TruFin | https://trufin.io | https://github.com/TruFin-io
uniswaponzksync | Uniswap on zkSync | https://uniswap.org | NO_GITHUB
universalpage |  | https://universal.page | NO_GITHUB
unstoppablewallet | Unstoppable Wallet | https://unstoppable.money | NO_GITHUB
usdn | USDN | https://usdn.lol | NO_GITHUB
usdt0 | USDT0 | https://usdt0.to | NO_GITHUB
usx | USX | https://usx.capital | https://github.com/scroll-tech/usx-contracts/tree/main/src
utix | Utix | https://utix.io | NO_GITHUB
vaultcraft |  | https://vaultcraft.io | NO_GITHUB
vechain | VeChain | https://vechain.org | https://github.com/vechain
velodromefinance | Velodrome Finance | https://velodrome.finance | NO_GITHUB
velvet-capital-v2 | Velvet Capital V2 | https://velvetcapital.com | NO_GITHUB
velvetcapital | Velvet Capital | https://dapp.velvet.capital | NO_GITHUB
vesper | Vesper | https://vesper.finance | NO_GITHUB
vesu | Vesu | https://vesu.xyz | https://github.com/vesuxyz
virtuals-protocol |  | https://app.virtuals.io | NO_GITHUB
voltz |  | https://voltz.xyz | NO_GITHUB
waymont |  | https://waymont.co | NO_GITHUB
wepiggy | WePiggy | https://wepiggy.com | https://github.com/WePiggy
wildcatprotocol | Wildcat Protocol | https://wildcat.finance | NO_GITHUB
wombatexchange | Wombat Exchange | https://wombat.exchange | NO_GITHUB
woofi | WOOFi | https://fi.woo.org | NO_GITHUB
wormhole | Wormhole | https://wormhole.com | https://github.com/wormhole-foundation
xion | XION | https://xion.burnt.com | https://github.com/burnt-lab
xoxno | XOXNO | https://xoxno.com | https://github.com/xoxno
xterio | Xterio | https://x.xyz | NO_GITHUB
yamatoprotocol |  | https://app.yamato.fi | NO_GITHUB
yearnfinance | Yearn Finance | https://yearn.fi | NO_GITHUB
yelay | yelay.io | https://yelay.io | NO_GITHUB
yieldnest |  | https://yieldnest.finance | NO_GITHUB
yo-protocol | YO Protocol | https://app.yo.xyz | NO_GITHUB
zano | Zano | https://zano.org | https://github.com/hyle-team
zenlink | Zenlink | https://zenlink.pro | NO_GITHUB
zerion | Zerion | https://zerion.io | NO_GITHUB
zerolend |  | https://zerolend.xyz | NO_GITHUB
zest-protocol-v2 | Zest Protocol V2 | https://zestprotocol.com | https://github.com/Zest-Protocol/zest-v2-contracts
zksync | ZKsync Lite | https://app.txsync.io | https://github.com/matter-labs/zksync
zksync-os | ZKsync OS | https://zksync.io | https://github.com/matter-labs
zksyncera | ZKsync Era | https://zksync.io | https://github.com/matter-labs
zkverify | zkVerify | https://zkverify.io | https://github.com/orgs/zkVerify/
zodiac |  | https://zodiac.wiki | NO_GITHUB