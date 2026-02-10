import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import pLimit from 'p-limit'

const DEFAULT_BRANDING = {
  primary: '#6366F1',
  accent: '#3730A3',
  text_on_primary: '#FFFFFF',
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

function withDefaultBranding(json) {
  return {
    ...json,
    branding: DEFAULT_BRANDING,
  }
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
    return DEFAULT_BRANDING
  }

  try {
    const response = await fetchWithRetry(logoUrl)
    const contentType = (response.headers.get('content-type') || '').toLowerCase()
    const isImage = contentType.startsWith('image/') || looksLikeImageByUrl(logoUrl)

    if (!isImage) {
      return DEFAULT_BRANDING
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
        return DEFAULT_BRANDING
      }

      const primary = rgbToHex(dominant.r, dominant.g, dominant.b)
      const accentRgb = darkenColor(dominant, 0.6)
      const accent = rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b)
      const text_on_primary = getTextOnPrimary(dominant)

      return { primary, accent, text_on_primary }
    } catch {
      return DEFAULT_BRANDING
    }
  } catch {
    return DEFAULT_BRANDING
  }
}

async function main() {
  const indexPath = path.join(protocolsDir, '_index.json')
  const indexRaw = await fs.readFile(indexPath, 'utf8')
  const index = JSON.parse(indexRaw)
  const slugs = index.protocols.map((entry) => entry.slug)

  const limit = pLimit(CONCURRENCY)
  let processed = 0

  await Promise.all(
    slugs.map((slug) =>
      limit(async () => {
        const filePath = path.join(protocolsDir, `${slug}.json`)
        const raw = await fs.readFile(filePath, 'utf8')
        const json = JSON.parse(raw)

        if (json.branding) {
          processed += 1
          console.log(`[${processed}/${slugs.length}] ${slug} — primary: ${json.branding.primary} accent: ${json.branding.accent}`)
          await sleep(DELAY_MS)
          return
        }

        const branding = await extractBrandingFromLogo(json.logo_url)
        const updated = branding === DEFAULT_BRANDING ? withDefaultBranding(json) : { ...json, branding }

        await fs.writeFile(filePath, `${JSON.stringify(updated, null, 2)}\n`)

        processed += 1
        console.log(`[${processed}/${slugs.length}] ${slug} — primary: ${updated.branding.primary} accent: ${updated.branding.accent}`)
        await sleep(DELAY_MS)
      })
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
