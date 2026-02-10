import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import pLimit from 'p-limit'

const DEFAULT_BRANDING = {
  primary: '#6366F1',
  accent: '#3730A3',
  text_on_primary: '#FFFFFF',
}

const CATEGORY_FALLBACKS = {
  'DeFi':                { primary: '#6366F1', accent: '#3730A3', text_on_primary: '#FFFFFF' },
  'DeFi Lending':        { primary: '#6366F1', accent: '#3730A3', text_on_primary: '#FFFFFF' },
  'DeFi Stablecoin':     { primary: '#6366F1', accent: '#3730A3', text_on_primary: '#FFFFFF' },
  'DeFi Staking':        { primary: '#10B981', accent: '#064E3B', text_on_primary: '#FFFFFF' },
  'DeFi Trading':        { primary: '#8B5CF6', accent: '#4C1D95', text_on_primary: '#FFFFFF' },
  'DeFi Yield':          { primary: '#6366F1', accent: '#3730A3', text_on_primary: '#FFFFFF' },
  'DEX':                 { primary: '#8B5CF6', accent: '#4C1D95', text_on_primary: '#FFFFFF' },
  'Bridge':              { primary: '#8B5CF6', accent: '#4C1D95', text_on_primary: '#FFFFFF' },
  'Layer 2':             { primary: '#3B82F6', accent: '#1E3A8A', text_on_primary: '#FFFFFF' },
  'L2 / L1':             { primary: '#3B82F6', accent: '#1E3A8A', text_on_primary: '#FFFFFF' },
  'Infrastructure':      { primary: '#10B981', accent: '#064E3B', text_on_primary: '#FFFFFF' },
  'Staking Infrastructure': { primary: '#10B981', accent: '#064E3B', text_on_primary: '#FFFFFF' },
  'Gaming/NFT':          { primary: '#EC4899', accent: '#831843', text_on_primary: '#FFFFFF' },
  'Privacy':             { primary: '#6366F1', accent: '#3730A3', text_on_primary: '#FFFFFF' },
  'RWA Tokenization':    { primary: '#F59E0B', accent: '#92400E', text_on_primary: '#000000' },
  'Security Platform':   { primary: '#EF4444', accent: '#7F1D1D', text_on_primary: '#FFFFFF' },
}

const KNOWN_BRAND_COLORS = {
  'aave':               { primary: '#B6509E', accent: '#6D2E5E', text_on_primary: '#FFFFFF' },
  'compoundfinance':    { primary: '#00D395', accent: '#007A59', text_on_primary: '#000000' },
  'balancer':           { primary: '#7B8CF7', accent: '#4A54A0', text_on_primary: '#FFFFFF' },
  'sushiswap':          { primary: '#FA52A0', accent: '#963160', text_on_primary: '#FFFFFF' },
  'pancakeswap':        { primary: '#1FC7D4', accent: '#12777F', text_on_primary: '#000000' },
  'synthetix':          { primary: '#00D1FF', accent: '#007D99', text_on_primary: '#000000' },
  'chainlink':          { primary: '#375BD2', accent: '#21377E', text_on_primary: '#FFFFFF' },
  'yearnfinance':       { primary: '#006AE3', accent: '#003F88', text_on_primary: '#FFFFFF' },
  'lido':               { primary: '#00A3FF', accent: '#006299', text_on_primary: '#000000' },
  'gmx':                { primary: '#2D42FC', accent: '#1B2897', text_on_primary: '#FFFFFF' },
  'arbitrum':           { primary: '#28A0F0', accent: '#186090', text_on_primary: '#FFFFFF' },
  'optimism':           { primary: '#FF0420', accent: '#990213', text_on_primary: '#FFFFFF' },
  'polygon':            { primary: '#8247E5', accent: '#4E2B89', text_on_primary: '#FFFFFF' },
  'avalanche':          { primary: '#E84142', accent: '#8B2728', text_on_primary: '#FFFFFF' },
  'eigenlayer':         { primary: '#1A0578', accent: '#0F0348', text_on_primary: '#FFFFFF' },
  'pendle':             { primary: '#26D9D9', accent: '#178282', text_on_primary: '#000000' },
  'starknet':           { primary: '#EC796B', accent: '#8D4940', text_on_primary: '#FFFFFF' },
  'zksync':             { primary: '#4E529A', accent: '#2F315C', text_on_primary: '#FFFFFF' },
  'scroll':             { primary: '#FFEEDA', accent: '#998E83', text_on_primary: '#000000' },
  'linea':              { primary: '#61DFFF', accent: '#3A8599', text_on_primary: '#000000' },
  'wormhole':           { primary: '#A45EFF', accent: '#623899', text_on_primary: '#FFFFFF' },
  'celer':              { primary: '#30D5C8', accent: '#1C8078', text_on_primary: '#000000' },
  'thorchain':          { primary: '#33FF99', accent: '#1F995C', text_on_primary: '#000000' },
  'injective':          { primary: '#00F2FE', accent: '#009198', text_on_primary: '#000000' },
  'sei':                { primary: '#9B1C2E', accent: '#5D111C', text_on_primary: '#FFFFFF' },
  'orca':               { primary: '#FFD15C', accent: '#997D37', text_on_primary: '#000000' },
  'raydium':            { primary: '#2B6AFF', accent: '#1A3F99', text_on_primary: '#FFFFFF' },
  'marinade':           { primary: '#309E8A', accent: '#1D5F53', text_on_primary: '#FFFFFF' },
  'morpho':             { primary: '#2470FF', accent: '#154399', text_on_primary: '#FFFFFF' },
  'ethena':             { primary: '#7B3FE4', accent: '#4A2689', text_on_primary: '#FFFFFF' },
  'aurafinance':        { primary: '#7C3AED', accent: '#4A238E', text_on_primary: '#FFFFFF' },
  'velodromefinance':   { primary: '#2180DF', accent: '#144D86', text_on_primary: '#FFFFFF' },
  'traderjoe':          { primary: '#E8544F', accent: '#8B3330', text_on_primary: '#FFFFFF' },
  'rocketpool':         { primary: '#FF6E30', accent: '#99421D', text_on_primary: '#FFFFFF' },
  'driftprotocol':      { primary: '#E44EFC', accent: '#892F97', text_on_primary: '#FFFFFF' },
  'immutable':          { primary: '#24C8DB', accent: '#167883', text_on_primary: '#000000' },
  'bobanetwork':        { primary: '#CCFF00', accent: '#7A9900', text_on_primary: '#000000' },
  'metis':              { primary: '#00CFBE', accent: '#007C72', text_on_primary: '#000000' },
  'moonbeamnetwork':    { primary: '#53CBC9', accent: '#327378', text_on_primary: '#000000' },
  'cardanofoundation':  { primary: '#0033AD', accent: '#001F68', text_on_primary: '#FFFFFF' },
  'polkastarter':       { primary: '#FF2D55', accent: '#991B33', text_on_primary: '#FFFFFF' },
  'magpiexyz':          { primary: '#4F46E5', accent: '#302A89', text_on_primary: '#FFFFFF' },
  'ankr':               { primary: '#2E6BF6', accent: '#1C4094', text_on_primary: '#FFFFFF' },
  'apecoinmainnet':     { primary: '#0050FF', accent: '#003099', text_on_primary: '#FFFFFF' },
  'astarnetwork':       { primary: '#0070EB', accent: '#00438D', text_on_primary: '#FFFFFF' },
  'badger':             { primary: '#F2A52B', accent: '#91631A', text_on_primary: '#000000' },
  'hashflow':           { primary: '#0500FF', accent: '#030099', text_on_primary: '#FFFFFF' },
  'uniswaponzksync':    { primary: '#FF007A', accent: '#990049', text_on_primary: '#FFFFFF' },
  // Fixed: protocols that previously extracted near-white/black/gray
  'layerzero':          { primary: '#A77BCA', accent: '#64497A', text_on_primary: '#FFFFFF' },
  'stargate':           { primary: '#A77BCA', accent: '#64497A', text_on_primary: '#FFFFFF' },
  'hedera':             { primary: '#3D3D3D', accent: '#252525', text_on_primary: '#FFFFFF' },
  'radiant':            { primary: '#1C4A7E', accent: '#112D4C', text_on_primary: '#FFFFFF' },
  'mantlelsp':          { primary: '#65B3AE', accent: '#3D6B68', text_on_primary: '#000000' },
  '0x':                 { primary: '#6366F1', accent: '#3730A3', text_on_primary: '#FFFFFF' },
  '88mphv3':            { primary: '#6C63FF', accent: '#413B99', text_on_primary: '#FFFFFF' },
  'acala':              { primary: '#E40C5B', accent: '#890737', text_on_primary: '#FFFFFF' },
  'aleo':               { primary: '#00C0F9', accent: '#007396', text_on_primary: '#000000' },
  'axelarnetwork':      { primary: '#54A3BE', accent: '#326271', text_on_primary: '#FFFFFF' },
  'pstakeoncosmos':     { primary: '#C73238', accent: '#771E22', text_on_primary: '#FFFFFF' },
  'staderforbnb':       { primary: '#2775C9', accent: '#174678', text_on_primary: '#FFFFFF' },
}

const FORCE = process.argv.includes('--force')
const CONCURRENCY = 5
const DELAY_MS = 120
const protocolsDir = path.join(process.cwd(), 'public', 'protocols')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function toHex(v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0').toUpperCase() }
function rgbToHex(r, g, b) { return `#${toHex(r)}${toHex(g)}${toHex(b)}` }

function isNearWhiteOrBlack({ r, g, b }) {
  return (r >= 235 && g >= 235 && b >= 235) || (r <= 20 && g <= 20 && b <= 20)
}

function isGrayscale({ r, g, b }) {
  return (Math.max(r, g, b) - Math.min(r, g, b)) < 30
}

function getTextOnPrimary({ r, g, b }) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000000' : '#FFFFFF'
}

function darkenColor({ r, g, b }, f = 0.6) {
  return { r: r * f, g: g * f, b: b * f }
}

function looksLikeImage(url = '') {
  return /\.(svg|png|jpg|jpeg|webp|gif)(\?|$)/i.test(url)
}

async function fetchRetry(url, n = 2) {
  let err
  for (let i = 0; i < n; i++) {
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r
    } catch (e) { err = e; if (i < n - 1) await sleep(300) }
  }
  throw err
}

async function extractFromLogo(logoUrl) {
  if (!logoUrl) return null
  try {
    const res = await fetchRetry(logoUrl)
    const ct = (res.headers.get('content-type') || '').toLowerCase()
    if (!ct.startsWith('image/') && !looksLikeImage(logoUrl)) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const stats = await sharp(buf).resize(64, 64, { fit: 'cover' }).ensureAlpha().flatten({ background: '#050505' }).stats()
    const d = stats.dominant
    if (!d || isNearWhiteOrBlack(d) || isGrayscale(d)) return null
    const primary = rgbToHex(d.r, d.g, d.b)
    const acc = darkenColor(d)
    return { primary, accent: rgbToHex(acc.r, acc.g, acc.b), text_on_primary: getTextOnPrimary(d) }
  } catch { return null }
}

async function main() {
  const slugs = JSON.parse(await fs.readFile(path.join(protocolsDir, '_index.json'), 'utf8')).protocols.map(e => e.slug)
  console.log(`Processing ${slugs.length} protocols${FORCE ? ' (--force)' : ''}...\n`)
  const limit = pLimit(CONCURRENCY)
  let processed = 0, updated = 0, kept = 0

  await Promise.all(slugs.map(slug => limit(async () => {
    const fp = path.join(protocolsDir, `${slug}.json`)
    let raw
    try { raw = await fs.readFile(fp, 'utf8') } catch { processed++; return }
    const json = JSON.parse(raw)

    if (json.branding && !FORCE) {
      if (json.branding.primary !== DEFAULT_BRANDING.primary) { processed++; kept++; return }
    }

    if (KNOWN_BRAND_COLORS[slug]) {
      const b = KNOWN_BRAND_COLORS[slug]
      await fs.writeFile(fp, JSON.stringify({ ...json, branding: b }, null, 2) + '\n')
      processed++; updated++
      console.log(`[${processed}/${slugs.length}] ${slug} — known: ${b.primary}`)
      return
    }

    const b = await extractFromLogo(json.logo_url)
    if (b) {
      await fs.writeFile(fp, JSON.stringify({ ...json, branding: b }, null, 2) + '\n')
      processed++; updated++
      console.log(`[${processed}/${slugs.length}] ${slug} — extracted: ${b.primary}`)
      await sleep(DELAY_MS)
      return
    }

    const fb = CATEGORY_FALLBACKS[json.category] || DEFAULT_BRANDING
    await fs.writeFile(fp, JSON.stringify({ ...json, branding: fb }, null, 2) + '\n')
    processed++; updated++
    console.log(`[${processed}/${slugs.length}] ${slug} — fallback (${json.category}): ${fb.primary}`)
    await sleep(DELAY_MS)
  })))

  console.log(`\nDone. Updated: ${updated} | Kept: ${kept} | Total: ${slugs.length}`)
}

main().catch(e => { console.error(e); process.exit(1) })
