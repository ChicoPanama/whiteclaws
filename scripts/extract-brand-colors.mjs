import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import pLimit from 'p-limit'

const DEFAULT_BRANDING = {
  primary: '#6366F1',
  accent: '#3730A3',
  text_on_primary: '#FFFFFF',
}

/**
 * Known brand colors for major protocols, used as a fallback when logo
 * fetching is unavailable (e.g. sandboxed CI environments).
 */
const KNOWN_BRAND_COLORS = {
  'aave':               { primary: '#B6509E', accent: '#6D2E5E', text_on_primary: '#FFFFFF' },
  'compoundfinance':    { primary: '#00D395', accent: '#007A59', text_on_primary: '#000000' },
  'balancer':           { primary: '#1E1E1E', accent: '#121212', text_on_primary: '#FFFFFF' },
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
  'layerzero':          { primary: '#F0F0F0', accent: '#909090', text_on_primary: '#000000' },
  'wormhole':           { primary: '#A45EFF', accent: '#623899', text_on_primary: '#FFFFFF' },
  'stargate':           { primary: '#B0B0B0', accent: '#696969', text_on_primary: '#000000' },
  'celer':              { primary: '#30D5C8', accent: '#1C8078', text_on_primary: '#000000' },
  'thorchain':          { primary: '#33FF99', accent: '#1F995C', text_on_primary: '#000000' },
  'injective':          { primary: '#00F2FE', accent: '#009198', text_on_primary: '#000000' },
  'sei':                { primary: '#9B1C2E', accent: '#5D111C', text_on_primary: '#FFFFFF' },
  'hedera':             { primary: '#222222', accent: '#141414', text_on_primary: '#FFFFFF' },
  'orca':               { primary: '#FFD15C', accent: '#997D37', text_on_primary: '#000000' },
  'raydium':            { primary: '#2B6AFF', accent: '#1A3F99', text_on_primary: '#FFFFFF' },
  'marinade':           { primary: '#309E8A', accent: '#1D5F53', text_on_primary: '#FFFFFF' },
  'morpho':             { primary: '#2470FF', accent: '#154399', text_on_primary: '#FFFFFF' },
  'ethena':             { primary: '#7B3FE4', accent: '#4A2689', text_on_primary: '#FFFFFF' },
  'aurafinance':        { primary: '#7C3AED', accent: '#4A238E', text_on_primary: '#FFFFFF' },
  'radiant':            { primary: '#0B0B0F', accent: '#070709', text_on_primary: '#FFFFFF' },
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
  '0x':                 { primary: '#231F20', accent: '#151314', text_on_primary: '#FFFFFF' },
  '88mphv3':            { primary: '#6C63FF', accent: '#413B99', text_on_primary: '#FFFFFF' },
  'acala':              { primary: '#E40C5B', accent: '#890737', text_on_primary: '#FFFFFF' },
  'aleo':               { primary: '#00C0F9', accent: '#007396', text_on_primary: '#000000' },
  'ankr':               { primary: '#2E6BF6', accent: '#1C4094', text_on_primary: '#FFFFFF' },
  'apecoinmainnet':     { primary: '#0050FF', accent: '#003099', text_on_primary: '#FFFFFF' },
  'astarnetwork':       { primary: '#0070EB', accent: '#00438D', text_on_primary: '#FFFFFF' },
  'axelarnetwork':      { primary: '#2C2C2C', accent: '#1A1A1A', text_on_primary: '#FFFFFF' },
  'badger':             { primary: '#F2A52B', accent: '#91631A', text_on_primary: '#000000' },
  'mantlelsp':          { primary: '#000000', accent: '#1A1A1A', text_on_primary: '#FFFFFF' },
  'staderforbnb':       { primary: '#2775C9', accent: '#174678', text_on_primary: '#FFFFFF' },
  'pstakeoncosmos':     { primary: '#C73238', accent: '#771E22', text_on_primary: '#FFFFFF' },
  'hashflow':           { primary: '#0500FF', accent: '#030099', text_on_primary: '#FFFFFF' },
  'uniswaponzksync':    { primary: '#FF007A', accent: '#990049', text_on_primary: '#FFFFFF' },
}

const CONCURRENCY = 5
const DELAY_MS = 120

const protocolsDir = path.join(process.cwd(), 'public', 'protocols')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function toHex(value) {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0').toUpperCase()
}

function rgbToHex(r, g, b) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function isNearWhiteOrBlack({ r, g, b }) {
  const nearWhite = r > 240 && g > 240 && b > 240
  const nearBlack = r < 20 && g < 20 && b < 20
  return nearWhite || nearBlack
}

function isDefaultBranding(branding) {
  return (
    branding &&
    branding.primary === DEFAULT_BRANDING.primary &&
    branding.accent === DEFAULT_BRANDING.accent &&
    branding.text_on_primary === DEFAULT_BRANDING.text_on_primary
  )
}

function getTextOnPrimary({ r, g, b }) {
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.5 ? '#000000' : '#FFFFFF'
}

function darkenColor({ r, g, b }, factor = 0.6) {
  return {
    r: r * factor,
    g: g * factor,
    b: b * factor,
  }
}

function looksLikeImageByUrl(url = '') {
  return /\.(svg|png|jpg|jpeg|webp)(\?|$)/i.test(url)
}

async function fetchWithRetry(url, attempts = 2) {
  let lastError
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response
    } catch (error) {
      lastError = error
      if (i < attempts - 1) {
        await sleep(200)
      }
    }
  }
  throw lastError
}

async function extractBrandingFromLogo(logoUrl) {
  if (!logoUrl) {
    return null
  }

  try {
    const response = await fetchWithRetry(logoUrl)
    const contentType = (response.headers.get('content-type') || '').toLowerCase()
    const isImage = contentType.startsWith('image/') || looksLikeImageByUrl(logoUrl)

    if (!isImage) {
      return null
    }

    const bytes = Buffer.from(await response.arrayBuffer())

    try {
      const stats = await sharp(bytes)
        .resize(64, 64, { fit: 'cover' })
        .ensureAlpha()
        .flatten({ background: '#050505' })
        .stats()

      const dominant = stats.dominant
      if (!dominant || isNearWhiteOrBlack(dominant)) {
        return null
      }

      const primary = rgbToHex(dominant.r, dominant.g, dominant.b)
      const accentRgb = darkenColor(dominant, 0.6)
      const accent = rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b)
      const text_on_primary = getTextOnPrimary(dominant)

      return { primary, accent, text_on_primary }
    } catch {
      return null
    }
  } catch {
    return null
  }
}

async function main() {
  const indexPath = path.join(protocolsDir, '_index.json')
  const indexRaw = await fs.readFile(indexPath, 'utf8')
  const index = JSON.parse(indexRaw)
  const slugs = index.protocols.map((entry) => entry.slug)

  const limit = pLimit(CONCURRENCY)
  let processed = 0
  let updated_count = 0

  await Promise.all(
    slugs.map((slug) =>
      limit(async () => {
        const filePath = path.join(protocolsDir, `${slug}.json`)
        const raw = await fs.readFile(filePath, 'utf8')
        const json = JSON.parse(raw)

        // Skip protocols that already have non-default branding
        if (json.branding && !isDefaultBranding(json.branding)) {
          processed += 1
          console.log(`[${processed}/${slugs.length}] ${slug} — keep: ${json.branding.primary}`)
          return
        }

        // Try known brand colors first
        if (KNOWN_BRAND_COLORS[slug]) {
          const branding = KNOWN_BRAND_COLORS[slug]
          const updated = { ...json, branding }
          await fs.writeFile(filePath, `${JSON.stringify(updated, null, 2)}\n`)
          processed += 1
          updated_count += 1
          console.log(`[${processed}/${slugs.length}] ${slug} — known: ${branding.primary}`)
          return
        }

        // Try extracting from logo image
        const branding = await extractBrandingFromLogo(json.logo_url)
        if (branding) {
          const updated = { ...json, branding }
          await fs.writeFile(filePath, `${JSON.stringify(updated, null, 2)}\n`)
          processed += 1
          updated_count += 1
          console.log(`[${processed}/${slugs.length}] ${slug} — extracted: ${branding.primary}`)
          await sleep(DELAY_MS)
          return
        }

        // Fall back to default
        if (!json.branding) {
          const updated = { ...json, branding: DEFAULT_BRANDING }
          await fs.writeFile(filePath, `${JSON.stringify(updated, null, 2)}\n`)
        }

        processed += 1
        console.log(`[${processed}/${slugs.length}] ${slug} — default`)
        await sleep(DELAY_MS)
      })
    )
  )

  console.log(`\nDone. Updated ${updated_count}/${slugs.length} protocols.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
